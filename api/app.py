import random, string
from datetime import datetime
import os
from flask import Flask, request, jsonify, json, send_file
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, JWTManager
from flask_cors.extension import CORS
from werkzeug.utils import secure_filename
from bson.objectid import ObjectId
# celery
from extensions import celery, mongo_db
from tasks import convertir_a_mp3
from datetime import datetime
import traceback
# mongo
import pymongo
# dotenv
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'aac', 'm4a', 'ogg'}

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'top secret'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}
app.config['UPLOAD_FOLDER'] = './originales/'
app.config['CONVERT_FOLDER'] = './convertidos/'
app.config['BROKER_URL'] = os.environ.get('BROKER_URL')

CORS(app)
jwt = JWTManager(app)
celery.init_app(app)

def random_string(num_chars):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=num_chars))

def generate_url():
    url = random_string(10)
    while mongo_db.concurso.find_one({"url":url}) != None:
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
        return jsonify({"message": "Missing email parameter"}), 400

    user = mongo_db.user_admin.find_one({"email": email})
    if user == None:
        return jsonify({"msg": "User not Found"}), 404
    if password == user["contrasena"]:
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
    if coll.find_one({"email": email}) != None:
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
@jwt_required
def concursos():
    user = get_jwt_identity()
    if request.method == 'GET':
        u_concursos = mongo_db.concurso.find({"user_id": str(user["_id"])})
        u_concursos = list(u_concursos)
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
            "user_id": str(user["_id"])
        }
        mongo_db.concurso.insert_one(concurso)
        return jsonify(concurso), 201

@app.route('/api/concursos/<string:concurso_id>', methods=['GET','PUT','DELETE'])
@jwt_required
def concurso(concurso_id):
    user = get_jwt_identity()
    concurso_coll = mongo_db.concurso
    concurso = concurso_coll.find_one({"_id": ObjectId(concurso_id)})
    if concurso == None:
        return {"msg": "No se encontró un concurso"}, 404
    if str(user["_id"]) != concurso["user_id"]:
        return {"msg":"Solo se pueden acceder a concursos propios"}, 403
    if request.method == 'GET':
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
            concurso["guion"] = guion
        if recomendaciones:
            concurso["recomendaciones"] = recomendaciones
        if imagen:
            concurso["imagen_base64"] = imagen
        if url:
            if concurso_coll.find_one({"url":url}) != None:
                return jsonify({"msg":"la url ya esta en uso"}), 400
            else:
                concurso["url"] = url
        concurso_coll.update_one(
            {"_id": ObjectId(concurso_id)},
            {"$set": changes}
        )
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
        try:
            upload_directory = os.path.join(app.config['UPLOAD_FOLDER'],'{}/'.format(archivo_voz.id))
            convert_directory = os.path.join(app.config['CONVERT_FOLDER'],'{}/'.format(archivo_voz.id))
            os.makedirs(upload_directory, exist_ok=True)
            os.makedirs(convert_directory, exist_ok=True)
            path = os.path.join(upload_directory,filename)
            convert_path = os.path.join(convert_directory,'{}.mp3'.format(os.path.splitext(filename)[0]))
            archivo_voz["archivo_original"] = path
            archivo_voz["archivo_convertido"] = convert_path
            file.save(path)
            archivo_id = mongo_db.archivo.insert_one(archivo_voz).inserted_id
            archivo_voz["_id"] = str(archivo_id)
            return jsonify(archivo_voz), 201
        except:
            traceback.print_exc()
            return jsonify({"msg": "Error guardando el archivo"}), 500

    return jsonify({"msg":"Formato de archivo no soportado"}), 400

@app.route('/api/audio/<int:audio_id>', methods=['GET'])
def descargar_audio(audio_id):
    #ArchivoVoz.query.get_or_404(audio_id)
    archivo = mongo_db.archivo_voz.find_one({"_id": ObjectId(audio_id)})
    if archivo == None:
        return {"msg": "Archivo no encontrado"}, 404
    convertido = request.args.get('convertido') == '1'
    if convertido and not archivo["convertido"]:
        return jsonify({"msg": "El archivo de voz no se ha convertido"}), 400
    return send_file(archivo["archivo_convertido"] if convertido else archivo["archivo_original"]), 200
    #return send_file(archivo.archivo_original),200

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
    # ArchivoVoz.query.get_or_404(archivo_id)
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
        "cocnurso_id": concurso_id
    }
    voz["_id"] = mongo_db.voz.insert_one(voz).inserted_id
    convertir_a_mp3.delay(str(archivo["_id"]), archivo["archivo_original"], archivo["archivo_convertido"])
    return jsonify(voz), 201

@app.route('/api/concursos/<int:concurso_id>/voces', methods=['GET'])
@jwt_required
def voces_concurso(concurso_id):
    concurso = mongo_db.concurso.find_one({"_id": ObjectId(concurso_id)})
    if not concurso:
        return {"msg": "Concurso no encontrado"}, 404
    user = get_jwt_identity()
    if str(user["_id"]) != concurso["user_id"]:
        return jsonify({"msg": "Debe ser el dueño del concurso para ver las voces"}),403
    page = request.args.get('page')
    page = int(page) if page else 1
    skipped = (page-1)*50
    voces_pag = mongo_db.voz.find({"concurso_id": concurso_id})\
        .sort("f_creacion", pymongo.DESCENDING)\
        .skip(skipped)\
        .limit(50)
    voces = list(voces_pag)
    num_pags = len(voces)
    return jsonify({"voces": voces, "total_pags": num_pags}), 200

@app.route('/api/url/<string:concurso_url>/voces', methods=['GET'])
def voces_concurso_activo(concurso_url):
    now = datetime.now()
    #Concurso.query.filter_by(url=concurso_url).filter(Concurso.f_fin > now).first()
    concurso = mongo_db.concurso.find_one({"url": concurso_url})
    if concurso:
        if not concurso["f_fin"] > now:
            concurso = None
    if not concurso:
        return jsonify({"msg":"No existe ningun concurso activo con la url especificada"}), 404
    page = request.args.get('page')
    page = int(page) if page else 1
    skipped = (page-1)*50
    #Voz.query.filter_by(concurso_id=concurso.id).filter(Voz.archivo_voz.has(convertido=True)). \
    #    order_by(Voz.f_creacion.desc()).paginate(page=page, per_page=50)
    voces = mongo_db.voz.find({"concurso_id": str(concurso["_id"]), "convertido": True})\
        .sort("f_creacion", pymongo.DESCENDING)\
        .skip(skipped)\
        .limit(50)
    voces = list(voces)
    num_pags = len(voces)
    return jsonify({"voces": voces, "total_pags": num_pags}), 200

if __name__ == '__main__':
    app.run(debug=True)
