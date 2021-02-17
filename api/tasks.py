from celery import Celery
import subprocess
from models import db, ArchivoVoz

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def convertir_a_mp3(archivo_id, path_origen, path_destino):
	print(archivo_id,path_origen,path_destino)
	print('-> Convirtiendo archivo {}'.format(archivo_id))
	proc = subprocess.Popen(['ffmpeg', '-i', path_origen, path_destino])
	proc.wait()
	archivo = ArchivoVoz.query.get(int(archivo_id))
	archivo.convertido = True
	print('-> Archivo {} convertido'.format(archivo_id))
	db.session.commit()
