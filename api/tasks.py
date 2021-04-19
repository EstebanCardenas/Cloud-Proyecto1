from extensions import celery
from app import mongo_db, ObjectId
import subprocess
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import boto3
import logging

email_from = os.environ['ADMIN_EMAIL']
password = os.environ['ADMIN_PASSWORD']
ip_front = os.environ['IP_FRONT']
bucket = os.environ['BUCKET_NAME']


@celery.task
def convertir_a_mp3(archivo_id, objeto_origen, objeto_destino):
    s3 = boto3.client('s3')
    s3.download_file(bucket, objeto_origen, objeto_origen)
    proc = subprocess.Popen(['ffmpeg', '-nostdin', '-y', '-i', objeto_origen, objeto_destino])
    proc.wait()
    # Subir convertido a S3
    try:
        response = s3.upload_file(objeto_destino, bucket, objeto_destino)
    except ClientError as e:
        logging.error(e)
        raise e
    # Eliminar archivos
    if os.path.exists(objeto_origen):
        os.remove(objeto_origen)
    if os.path.exists(objeto_destino):
        os.remove(objeto_destino)
    # Actualizar a convertido
    mongo_db.archivo_voz.update_one(
        {"_id": ObjectId(archivo_id)},
        {"$set": {
            "convertido": True
        }}
    )
    voz = mongo_db.voz.find_one({"archivo_id": archivo_id})
    email_to = voz["email"]
    nombres = voz["nombres"]
    full_url = 'http://{}/{}'.format(ip_front, voz.concurso.url)
    enviar_email(email_from, email_to, password, nombres, full_url)

def enviar_email(email_from, email_to, password, nombres, full_url):
    #print('email')
    #print(email_from, email_to)
    content = '''Hola {},

Te informamos que hemos procesado tu voz y ahora puede ser encontrada en la pagina principal del concurso:
{}
Si tu voz es seleccionada como ganadora del concurso, te contactaremos para darte mas detalles.

SuperVoices.'''.format(nombres, full_url)
    message = MIMEMultipart()
    message['From'] = email_from
    message['To'] = email_to
    message['Subject'] = 'Se ha procesado tu voz exitosamente.'
    message.attach(MIMEText(content, 'plain'))
    session = smtplib.SMTP('smtp.gmail.com', 587)
    session.starttls()
    session.login(email_from, password)
    text = message.as_string()
    session.sendmail(email_from, email_to, text)
    session.quit()
