import random, string
from datetime import datetime
import os
from flask import Flask, request, jsonify, json, send_file
from flask_cors.extension import CORS
from flask_praetorian import Praetorian, auth_required, current_user
from werkzeug.utils import secure_filename
#modelos
from models import *
from extensions import celery
from tasks import convertir_a_mp3
from datetime import datetime
import traceback
import base64

UPLOAD_FOLDER = './originales/'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'aac', 'm4a', 'ogg'}

app = Flask(__name__)
app.config['SECRET_KEY'] = 'top secret'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'#os.environ['DATABASE_URI']
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CONVERT_FOLDER'] = './convertidos/'
app.config['BROKER_URL'] = 'redis://localhost:6379'

CORS(app)
guard = Praetorian()

#with app.app_context():
db.init_app(app)
ma.init_app(app)
guard.init_app(app, UserAdmin)
celery.init_app(app)


with app.app_context():
    #Voz.__table__.drop(db.engine)
    #db.drop_all()
    db.create_all()


def random_string(num_chars):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=num_chars))


def generate_url():
    url = random_string(10)
    while db.session.query(Concurso).filter_by(url=url).count() > 0:
        url = random_string(10)
    return url


def allowed_file(ext):
    return ext in ALLOWED_EXTENSIONS


def extract_ext(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/api/login', methods=['POST'])
def login():
    req = json.loads(request.data)
    email = req.get('email', None)
    password = req.get('password', None)
    user = guard.authenticate(email, password)
    return jsonify({'access_token': guard.encode_jwt_token(user)}), 200


@app.route('/api/register', methods=['POST'])
def register():
    req = json.loads(request.data)
    email = req.get('email', None)
    password = req.get('password', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    if not email or not password or not nombres or not apellidos:
        return jsonify({"msg": "Formulario incompleto"}), 400
    if db.session.query(UserAdmin).filter_by(email=email).count() < 1:
        db.session.add(UserAdmin(
            email=email,
            contrasena=guard.hash_password(password),
            nombres=nombres,
            apellidos=apellidos
        ))
        db.session.commit()
        return {"msg": "usuario creado"}, 201

    else:
        return {"msg": "El email ya esta registrado"}, 400


@app.route('/api/concursos', methods=['GET','POST'])
@auth_required
def concursos():
    user = current_user()
    if request.method == 'GET':
        return jsonify(concursosSchema.dump(user.concursos)), 200
    elif request.method == 'POST':
        req = json.loads(request.data)
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        if f_inicio:
            f_inicio = datetime.fromisoformat(f_inicio)
            #if (f_inicio <= datetime.now()):
            #    return jsonify({"msg": "La fecha de inicio es menor o igual a la fecha actual"}), 400
        f_fin = req.get('f_fin', None)
        if f_fin:
            f_fin = datetime.fromisoformat(f_fin)
            if f_inicio:
                if f_inicio >= f_fin:
                    return jsonify({"msg": "La fecha de inicio es igual o mayor a la de fin"}), 400
        valor_paga = req.get('valor_paga',None)
        guion = req.get('guion',None)
        recomendaciones = req.get('recomendaciones',None)
        print('reqprint', req)
        imagen = req.get('imagen_base64',None)
        # if imagen:
        #     data_bytes = imagen.encode("utf-8")
        #     imagen = base64.b64encode(data_bytes)
        url = req.get('url',None)
        if not nombre or not f_inicio or not f_fin or \
            not valor_paga or not guion or not recomendaciones:
            return jsonify({"msg": "Formulario incompleto"}), 400
        if url:
            if db.session.query(Concurso).filter_by(url=url).count() > 0:
                return jsonify({"msg": "El url ya esta en uso"}), 400
        else:
            url = generate_url()

        concurso = Concurso(
            nombre=nombre,
            f_inicio=f_inicio,
            f_fin=f_fin,
            valor_paga=valor_paga,
            guion=guion,
            imagen_base64=imagen,
            url=url,
            recomendaciones=recomendaciones,
            user_id=user.id
        )
        db.session.add(concurso)
        db.session.commit()
        return concursoSchema.dump(concurso), 201


@app.route('/api/concursos/<int:concurso_id>', methods=['GET','PUT','DELETE'])
@auth_required
def concurso(concurso_id):
    user = current_user()
    concurso = Concurso.query.get_or_404(concurso_id)
    if user.id != concurso.user_id:
        return {"msg":"Solo se pueden acceder a concursos propios"},403
    if request.method == 'GET':
        return concursoSchema.dump(concurso)
    elif request.method == 'PUT':
        req = json.loads(request.data)
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('guion',None)
        recomendaciones = req.get('recomendaciones',None)
        imagen = req.get('imagen_base64',None)
        print(imagen)
        if imagen:
            data_bytes = imagen.encode("utf-8")
            imagen = base64.b64encode(data_bytes)
        url = req.get('url',None)
        if nombre:
            concurso.nombre = nombre
        if f_inicio:
            concurso.f_inicio = datetime.fromisoformat(f_inicio)
        if f_fin:
            concurso.f_fin = datetime.fromisoformat(f_fin)
        if valor_paga:
            concurso.valor_paga = valor_paga
        if guion:
            concurso.guion = guion
        if recomendaciones:
            concurso.recomendaciones = recomendaciones
        if imagen:
            concurso.imagen_base64 = imagen
        if url:
            if Concurso.query.filter_by(url=url).count() > 0:
                return jsonify({"msg":"la url ya esta en uso"}),400
            else:
                concurso.url = url
        db.session.commit()
        return concursoSchema.dump(concurso),200
    else:
        db.session.delete(concurso)
        db.session.commit()
        return '',204


@app.route('/api/url/<string:concurso_url>', methods=['GET'])
def concursoUrl(concurso_url):
    now = datetime.now()
    print(concurso_url)
    concurso = Concurso.query.filter_by(url=concurso_url).filter(Concurso.f_fin > now).first()
    if not concurso:
        return jsonify({"msg":"No existe ningun concurso activo con la url especificada"}),404
    return concursoSchema.dump(concurso),200


@app.route('/api/audio', methods=['POST'])
def subir_audio():
    print(request.files)
    if 'file' not in request.files:
        return jsonify({"msg":"El archivo de audio es requerido"}),400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg":"El archivo de audio es requerido"}),400
    ext = extract_ext(file.filename)
    if allowed_file(ext):
        filename = secure_filename(file.filename)
        archivo_voz = ArchivoVoz()
        db.session.add(archivo_voz)
        db.session.commit()
        try:
            upload_directory = os.path.join(app.config['UPLOAD_FOLDER'],'{}/'.format(archivo_voz.id))
            convert_directory = os.path.join(app.config['CONVERT_FOLDER'],'{}/'.format(archivo_voz.id))
            os.makedirs(upload_directory, exist_ok=True)
            os.makedirs(convert_directory, exist_ok=True)
            path = os.path.join(upload_directory,filename)
            convert_path = os.path.join(convert_directory,'{}.mp3'.format(os.path.splitext(filename)[0]))
            archivo_voz.archivo_original = path
            archivo_voz.archivo_convertido = convert_path
            file.save(path)
            db.session.commit()
            return archivoVozSchema.dump(archivo_voz),201
        except:
            traceback.print_exc()
            db.session.delete(archivo_voz)
            db.session.commit()
            return jsonify({"msg":"Error guardando el archivo"}),500

    return jsonify({"msg":"Formato de archivo no soportado"}),400


@app.route('/api/audio/<int:audio_id>', methods=['GET'])
def descargar_audio(audio_id):
    archivo = ArchivoVoz.query.get_or_404(audio_id)
    voz = archivo.voz
    convertido = request.args.get('convertido') == '1'
    if not voz or not archivo.archivo_original:
        return jsonify({"msg":"Archivo de voz no encontrado"}),404
    if convertido and not archivo.convertido:
        return jsonify({"msg":"El archivo de voz no se ha convertido"}),400
    return send_file(archivo.archivo_convertido if convertido else archivo.archivo_original),200


@app.route('/api/voz', methods=['POST'])
def subir_voz():
    f_creacion = datetime.now()
    req = json.loads(request.data)
    email = req.get('email', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    observaciones = req.get('observaciones',None)
    archivo_id = req.get('archivo_id',None)
    concurso_id = req.get('concurso_id',None)
    
    Concurso.query.get_or_404(concurso_id)
    archivo = ArchivoVoz.query.get_or_404(archivo_id)
    if not archivo.archivo_original:
        return jsonify({"msg":"Archivo de audio no existente"}),404

    voz = Voz(
        f_creacion=f_creacion,
        email=email,
        nombres=nombres,
        apellidos=apellidos,
        observaciones=observaciones,
        archivo_id=archivo_id,
        concurso_id=concurso_id,
    )
    db.session.add(voz)
    db.session.commit()
    convertir_a_mp3.delay(str(archivo.id), archivo.archivo_original, archivo.archivo_convertido)
    return vozSchema.dump(voz),201


@app.route('/api/concursos/<int:concurso_id>/voces', methods=['GET'])
@auth_required
def voces_concurso(concurso_id):
    concurso = Concurso.query.get_or_404(concurso_id)
    user = current_user()
    if user.id != concurso.user_id:
        return jsonify({"msg":"Debe ser el dueño del concurso para ver las voces"}),403
    page = request.args.get('page')
    print(page)
    page = int(page) if page else 1
    voces_pag = Voz.query.filter_by(concurso_id=concurso_id).order_by(Voz.f_creacion.desc()).paginate(page=page,per_page=50)
    voces = voces_pag.items
    num_pags = voces_pag.pages
    return jsonify({"voces":vocesSchema.dump(voces), "total_pags":num_pags}),200


@app.route('/api/url/<string:concurso_url>/voces', methods=['GET'])
def voces_concurso_activo(concurso_url):
    now = datetime.now()
    concurso = Concurso.query.filter_by(url=concurso_url).filter(Concurso.f_fin > now).first()
    if not concurso:
        return jsonify({"msg":"No existe ningun concurso activo con la url especificada"}),404
    page = request.args.get('page')
    page = int(page) if page else 1
    voces_pag = Voz.query.filter_by(concurso_id=concurso.id).filter(Voz.archivo_voz.has(convertido=False)).\
        order_by(Voz.f_creacion.desc()).paginate(page=page,per_page=50)
    voces = voces_pag.items
    num_pags = voces_pag.pages
    return jsonify({"voces":vocesSchemaSeguro.dump(voces), "total_pags":num_pags}),200


if __name__ == '__main__':
    app.run(debug=True)
