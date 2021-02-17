from extensions import celery
from models import ArchivoVoz, db
import subprocess
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

email_from = "supervoices02@gmail.com"#os.environ['ADMIN_EMAIL']
password = "supervoces20"#os.environ['ADMIN_PASSWORD']
ip_front = "123"#os.environ['IP_FRONT']

@celery.task
def convertir_a_mp3(archivo_id, path_origen, path_destino):
    proc = subprocess.Popen(['ffmpeg', '-nostdin', '-y', '-i', path_origen, path_destino])
    proc.wait()
    archivo = ArchivoVoz.query.get(int(archivo_id))
    archivo.convertido = True
    db.session.commit()
    voz = archivo.voz
    email_to = voz.email
    nombres = voz.nombres
    full_url = 'http://{}/{}'.format(ip_front, voz.concurso.url)
    enviar_email(email_from, email_to, password, nombres, full_url)


def enviar_email(email_from, email_to, password, nombres, full_url):
    print('email')
    print(email_from,email_to)
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
