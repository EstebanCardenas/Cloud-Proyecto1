from app import mongo_db, ObjectId
import subprocess
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import boto3
import logging
from time import sleep
import json

ip_front = os.environ.get('IP_FRONT')
bucket = os.environ['BUCKET_NAME']
queue_url = os.environ['QUEUE_URL']
sqs_client = boto3.client('sqs')

def convertir_a_mp3(archivo_id, objeto_origen, objeto_destino):
    s3 = boto3.client('s3')
    s3.download_file(bucket, objeto_origen, objeto_origen)
    proc = subprocess.Popen(['ffmpeg', '-nostdin', '-y', '-i', objeto_origen, objeto_destino])
    proc.wait()
    # Subir convertido a S3
    response = s3.upload_file(objeto_destino, bucket, objeto_destino)
    # Eliminar archivos
    if os.path.exists(objeto_origen):
        os.remove(objeto_origen)
    if os.path.exists(objeto_destino):
        os.remove(objeto_destino)
    # Actualizar a convertido
    voz = mongo_db.voz.find_one({"archivo_id": archivo_id})
    concurso = mongo_db.concurso.find_one({"_id": ObjectId(voz['concurso_id'])})
    mongo_db.archivo_voz.update_one(
        {"_id": ObjectId(archivo_id)},
        {"$set": {
            "convertido": True
        }}
    )
    email_to = voz["email"]
    nombres = voz["nombres"]
    full_url = 'http://{}/{}'.format(ip_front, concurso['url'])
    enviar_email(email_from, email_to, password, nombres, full_url)

def enviar_email(email_to, nombres, full_url):
    key = os.environ.get("TRUSTIFI_KEY")
    secret = os.environ.get("TRUSTIFI_SECRET")
    content = '''Hola {},

Te informamos que hemos procesado tu voz y ahora puede ser encontrada en la pagina principal del concurso:
{}
Si tu voz es seleccionada como ganadora del concurso, te contactaremos para darte mas detalles.

SuperVoices.'''.format(nombres, full_url)
    url = 'https://be.trustifi.com/api/i/v1/email'
    payload = json.dumps({
        "title": "Supervoices - Voz Convertida",
        "html": content,
        "recipients": [{"email": email_to}]
    })
    headers = {
        'x-trustifi-key': key,
        'x-trustifi-secret': secret,
        'Content-Type': 'application/json'
    }
    return req.post(
        url,
        headers=headers,
        data=payload
    )

def main():
    while True:
        try:
            response = sqs_client.receive_message(QueueUrl=queue_url, WaitTimeSeconds=20)
            if response.get('Messages'):
                print(response['Messages'][0]['Body'])
                print(type(response['Messages'][0]['Body']))
                dic = json.loads(response['Messages'][0]['Body'])
                print(dic)
                print(type(dic))
                convertir_a_mp3(dic['id'], dic['original'], dic['convertido'])
                receipt_handle = response['Messages'][0]['ReceiptHandle']
                sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
            else:
                sleep(10)
        except Exception as e:
            logging.error(e)


if __name__ == '__main__':
    main()
