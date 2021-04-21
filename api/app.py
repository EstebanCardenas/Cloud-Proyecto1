import random
import string
import math as mt
from datetime import datetime, timedelta
import os
from flask import Flask, request, jsonify, json, send_file
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, JWTManager
from flask_cors.extension import CORS
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
import redis
# celery
from extensions import celery, mongo_db
from datetime import datetime
import traceback
# mongo
import pymongo
# dotenv
from dotenv import load_dotenv, find_dotenv
#aws
import boto3
from botocore.exceptions import ClientError

load_dotenv(find_dotenv())

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'aac', 'm4a', 'ogg'}

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = './originales/'
app.config['CONVERT_FOLDER'] = './convertidos/'
bucket = os.environ['BUCKET_NAME']
queue_url = os.environ['QUEUE_URL']

CORS(app)
jwt = JWTManager(app)
celery.init_app(app)
# redis
REDIS_URL = os.environ.get('REDIS_URL')
store = redis.Redis.from_url(REDIS_URL)

def random_string(num_chars):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=num_chars))

def generate_url():
    url = random_string(10)
    while mongo_db.concurso.find_one({"url":url}):
        url = random_string(10)
    return url

def allowed_file(ext):
    return ext in ALLOWED_EXTENSIONS

def extract_ext(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

@app.route('/api')
def hello_world():
    return 'Hello World!'

@app.route('/api/login', methods=['POST'])
def login():
    req = json.loads(request.data)
    email = req.get('email', None)
    password = req.get('password', None)
    if not email or not password:
        return jsonify({"msg": "Missing parameters"}), 400
    user = mongo_db.user_admin.find_one({"email": email})
    if user == None:
        return jsonify({"msg": "User not Found"}), 404
    if password == user["contrasena"]:
        user["_id"] = str(user["_id"])
        access_token = create_access_token(identity=user)
        return jsonify({'access_token': access_token}), 200
    else:
        return jsonify({"msg": "Incorrect Password"}), 200

@app.route('/api/register', methods=['POST'])
def register():
    req = json.loads(request.data)
    email = req.get('email', None)
    password = req.get('password', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    if not email or not password or not nombres or not apellidos:
        return jsonify({"msg": "Formulario incompleto"}), 400
    coll = mongo_db.user_admin
    if not coll.find_one({"email": email}):
        coll.insert_one({
            "email": email,
            "contrasena": password,
            "nombres": nombres,
            "apellidos": apellidos
        })
        return {"msg": "usuario creado"}, 201
    else:
        return {"msg": "El email ya esta registrado"}, 400

@app.route('/api/concursos', methods=['GET','POST'])
@jwt_required()
def concursos():
    user = get_jwt_identity()
    # Get cached id
    admin_id = store.get(user['email'])
    if not admin_id:
        admin_id = user["_id"]
        store.set(user['email'], user["_id"])

    if request.method == 'GET':
        u_concursos = mongo_db.concurso.find({"user_id": admin_id})
        u_concursos = list(u_concursos)
        for c in u_concursos:
            c["_id"] = str(c["_id"])
            c["f_inicio"] = str(c["f_inicio"]).replace(" ", "T")
            c["f_fin"] = str(c["f_fin"]).replace(" ", "T")
        return jsonify(u_concursos), 200
    elif request.method == 'POST':
        req = json.loads(request.data)
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        if f_inicio:
            f_inicio = datetime.fromisoformat(f_inicio)
        f_fin = req.get('f_fin', None)
        if f_fin:
            f_fin = datetime.fromisoformat(f_fin)
            if f_inicio:
                if f_inicio >= f_fin:
                    return jsonify({"msg": "La fecha de inicio es igual o mayor a la de fin"}), 400
        valor_paga = req.get('valor_paga', None)
        guion = req.get('guion', None)
        recomendaciones = req.get('recomendaciones', None)
        imagen = req.get('imagen_base64', None)
        url = req.get('url',None)
        if not nombre or not f_inicio or not f_fin or \
            not valor_paga or not guion or not recomendaciones:
            return jsonify({"msg": "Formulario incompleto"}), 400
        if url:
            if mongo_db.concurso.find_one({"url": url}):
                return jsonify({"msg": "El url ya esta en uso"}), 400
        else:
            url = generate_url()

        concurso = {
            "nombre": nombre,
            "f_inicio": f_inicio,
            "f_fin": f_fin,
            "valor_paga": valor_paga,
            "guion": guion,
            "image_base64": imagen,
            "url": url,
            "recomendaciones": recomendaciones,
            "user_id": admin_id
        }
        mongo_db.concurso.insert_one(concurso)
        concurso["_id"] = str(concurso["_id"])
        return jsonify(concurso), 201

@app.route('/api/concursos/<string:concurso_id>', methods=['GET','PUT','DELETE'])
@jwt_required()
def concurso(concurso_id):
    user = get_jwt_identity()
    # Get cached id
    admin_id = store.get(user['email'])
    if not admin_id:
        admin_id = user["_id"]
        store.set(user['email'], user["_id"])

    concurso_coll = mongo_db.concurso
    try:
        concurso = concurso_coll.find_one({"_id": ObjectId(concurso_id)})
    except Exception as e:
        return {"msg": str(e)}, 403
    if not concurso:
        return {"msg": "No se encontró un concurso"}, 404
    if admin_id != concurso["user_id"]:
        return {"msg": "Solo se pueden acceder a concursos propios"}, 403
    if request.method == 'GET':
        concurso["_id"] = str(concurso["_id"])
        return concurso, 200
    elif request.method == 'PUT':
        req = json.loads(request.data)
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('guion',None)
        recomendaciones = req.get('recomendaciones',None)
        imagen = req.get('imagen_base64',None)
        url = req.get('url',None)
        changes = {}
        if nombre:
            changes["nombre"] = nombre
        if f_inicio:
            changes["f_inicio"] = datetime.fromisoformat(f_inicio)
        if f_fin:
            changes["f_fin"] = datetime.fromisoformat(f_fin)
        if valor_paga:
            changes["valor_paga"] = valor_paga
        if guion:
            changes["guion"] = guion
        if recomendaciones:
            changes["recomendaciones"] = recomendaciones
        if imagen:
            changes["imagen_base64"] = imagen
        if url:
            if concurso_coll.find_one({"url":url}) != None:
                return jsonify({"msg": "La url ya esta en uso"}), 400
            else:
                changes["url"] = url

        if len(changes.items()) == 0:
            return jsonify({"msg": "No hay cambios para hacer"})
        concurso_coll.update_one(
            {"_id": ObjectId(concurso_id)},
            {"$set": changes}
        )
        concurso["_id"] = str(concurso["_id"])
        return concurso, 200
    else:
        concurso_coll.delete_one({"_id": ObjectId(concurso_id)})
        return '', 204

@app.route('/api/url/<string:concurso_url>', methods=['GET'])
def concursoUrl(concurso_url):
    now = datetime.now()
    concurso = mongo_db.concurso.find_one({"url":concurso_url})
    if not concurso:
        return jsonify({"msg": "No existe ningun concurso activo con la url especificada"}), 404
    if concurso["f_fin"] <= now:
        return jsonify({"msg": "El concurso ya terminó"}), 404
    concurso["_id"] = str(concurso["_id"])
    return concurso, 200

@app.route('/api/audio', methods=['POST'])
def subir_audio():
    if 'file' not in request.files:
        return jsonify({"msg": "El archivo de audio es requerido"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "El archivo de audio es requerido"}), 400
    ext = extract_ext(file.filename)
    if allowed_file(ext):
        filename = secure_filename(file.filename)
        archivo_voz = {
            "archivo_original": None,
            "archivo_convertido": None,
            "convertido": False
        }
        archivo_id = mongo_db.archivo_voz.insert_one(archivo_voz).inserted_id
        try:
            # update
            archivo_voz["archivo_original"] = '{}.{}'.format(str(archivo_id), ext)
            archivo_voz["archivo_convertido"] = '{}.mp3'.format(str(archivo_id))
            changes = {
                "archivo_original": '{}.{}'.format(str(archivo_id), ext),
                "archivo_convertido": '{}.mp3'.format(str(archivo_id))
            }
            s3_client = boto3.client('s3')
            try:
                response = s3_client.upload_fileobj(file, bucket, archivo_voz["archivo_original"])
            except ClientError as e:
                logging.error(e)
                return jsonify({"msg": "Error subiendo el archivo"}), 500
            mongo_db.archivo_voz.update_one(
                {"_id": archivo_id},
                {"$set": changes}
            )
            archivo_voz["_id"] = str(archivo_id)
            return jsonify(archivo_voz), 201
        except:
            traceback.print_exc()
            return jsonify({"msg": "Error guardando el archivo"}), 500

    return jsonify({"msg": "Formato de archivo no soportado"}), 400

@app.route('/api/audio/<string:audio_id>', methods=['GET'])
def descargar_audio(audio_id):
    archivo = mongo_db.archivo_voz.find_one({"_id": ObjectId(audio_id)})
    if not archivo:
        return {"msg": "Archivo no encontrado"}, 404
    convertido = request.args.get('convertido') == '1'
    if convertido and not archivo["convertido"]:
        return jsonify({"msg": "El archivo de voz no se ha convertido"}), 400
    object_name = archivo["archivo_original"]
    if convertido:
        object_name = archivo["archivo_convertido"]
    # Enviar archivo desde S3
    s3 = boto3.client('s3')
    file = s3.get_object(Bucket=bucket, Key=object_name)
    return send_file(file['Body'].read()), 200

@app.route('/api/voz', methods=['POST'])
def subir_voz():
    f_creacion = datetime.now()
    req = json.loads(request.data)
    email = req.get('email', None)
    nombres = req.get('nombres', None)
    apellidos = req.get('apellidos', None)
    observaciones = req.get('observaciones', None)
    archivo_id = req.get('archivo_id', None)
    concurso_id = req.get('concurso_id', None)

    if not mongo_db.concurso.find_one({"_id": ObjectId(concurso_id)}):
        return {"msg": "Concurso no encontrado"}, 404
    archivo = mongo_db.archivo_voz.find_one({"_id": ObjectId(archivo_id)})
    if not archivo["archivo_original"]:
        return jsonify({"msg": "Archivo de audio no existente"}),404

    voz = {
        "f_creacion": f_creacion,
        "email": email,
        "nombres": nombres,
        "apellidos": apellidos,
        "observaciones": observaciones,
        "archivo_id": archivo_id,
        "concurso_id": concurso_id
    }
    voz["_id"] = str(mongo_db.voz.insert_one(voz).inserted_id)
    sqs = boto3.client('sqs')
    msg = '{{"id": "{}", "original": "{}", "convertido": "{}"}}'.format(str(archivo["_id"]), 
        archivo["archivo_original"], archivo["archivo_convertido"])
    sqs.send_message(QueueUrl=queue_url, MessageBody=msg)
    return jsonify(voz), 201

@app.route('/api/concursos/<string:concurso_id>/voces', methods=['GET'])
@jwt_required()
def voces_concurso(concurso_id):
    concurso = mongo_db.concurso.find_one({"_id": ObjectId(concurso_id)})
    if not concurso:
        return {"msg": "Concurso no encontrado"}, 404

    user = get_jwt_identity()
    # Get cached id
    admin_id = store.get(user['email'])
    if not admin_id:
        admin_id = user["_id"]
        store.set(user['email'], user["_id"])
    if admin_id != concurso["user_id"]:
        return jsonify({"msg": "Debe ser el dueño del concurso para ver las voces"}), 403

    page = request.args.get('page')
    page = int(page) if page else 1
    skipped = (page-1)*50
    voces = mongo_db.voz.find({"concurso_id": concurso_id})\
        .sort("f_creacion", pymongo.DESCENDING)\
        .skip(skipped)\
        .limit(50)
    voces = list(voces)
    for v in voces: v["_id"] = str(v["_id"])
    num_pags = mt.ceil(len(voces)/50)
    return jsonify({"voces": voces, "total_pags": num_pags}), 200

@app.route('/api/url/<string:concurso_url>/voces', methods=['GET'])
def voces_concurso_activo(concurso_url):
    now = datetime.now()
    concurso = mongo_db.concurso.find_one({"url": concurso_url})
    if concurso:
        if concurso["f_fin"] <= now:
            concurso = None
    if not concurso:
        return jsonify({"msg": "No existe ningun concurso activo con la url especificada"}), 404
    page = request.args.get('page')
    page = int(page) if page else 1
    voces = list(mongo_db.voz.find({"concurso_id": str(concurso["_id"])}))
    def filt_func(voz):
        print(voz)
        archivo = mongo_db.archivo_voz.find_one({"_id": ObjectId(voz["archivo_id"])})
        return archivo["convertido"]
    voces = list(filter(filt_func, voces))
    voces.sort(key=lambda el: el["f_creacion"], reverse=True)
    for v in voces: v["_id"] = str(v["_id"])
    idx = (page-1)*50
    voces = voces[idx:idx+50]
    num_pags = mt.ceil(len(voces)/50)
    return jsonify({"voces": voces, "total_pags": num_pags}), 200

if __name__ == '__main__':
    app.run(debug=True)
