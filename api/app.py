import random, string
from datetime import datetime
import os
from flask import Flask, request, jsonify
from flask_cors.extension import CORS
from flask_praetorian import Praetorian, auth_required, current_user
from werkzeug.utils import secure_filename
#modelos
from models import *

UPLOAD_FOLDER = './originales/'
ALLOWED_EXTENSIONS = {'wav','mp3', 'aac', 'm4a'}

app = Flask(__name__)
app.config['SECRET_KEY'] = 'top secret'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

CORS(app)
guard = Praetorian()

#with app.app_context():
db.init_app(app)
ma.init_app(app)
guard.init_app(app, UserAdmin)

with app.app_context():
    #ArchivoVoz.__table__.drop(db.engine)
    db.create_all()


def random_string(num_chars):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=num_chars))


def generate_url():
    url = random_string(10)
    while db.session.query(Concurso).filter_by(url=url).count() > 0:
        url = random_string(10)
    return url


def generate_filename():
    filename = random_string(16)
    while db.session.query(ArchivoVoz).filter_by(nombre=filename).count() > 0:
        filename = random_string(16)
    return filename

def allowed_file(ext):
    return ext in ALLOWED_EXTENSIONS


def extract_ext(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/api/login', methods=['POST'])
def login():
    req = request.get_json()
    email = req.get('email', None)
    password = req.get('password', None)
    user = guard.authenticate(email, password)
    return jsonify({'access_token': guard.encode_jwt_token(user)}), 200


@app.route('/api/register', methods=['POST'])
def register():
    req = request.get_json()
    email = req.get('email', None)
    password = req.get('password', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    if not email or not password or not nombres or not apellidos:
        return jsonify({"msg": "Formulario incompleto"}), 400
    #TODO chequear email regex
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
        return {"msg": "el email ya está usado"}, 400


@app.route('/api/concursos', methods=['GET','POST','PUT'])
@auth_required
def concursos():
    user = current_user()
    req = request.get_json()
    if request.method == 'GET':
        return jsonify(concursosSchema.dump(user.concursos)),200
    else:
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('guion',None)
        recomendaciones = req.get('recomendaciones',None)
        imagen = req.get('imagen_base64',None)
        url = req.get('url',None)
        if request.method == 'POST':
            if not nombre or not f_inicio or not f_fin or \
                not valor_paga or not guion or not recomendaciones:
                return jsonify({"msg": "Formulario incompleto"}), 400
            if url:
                if db.session.query(Concurso).filter_by(url=url).count() > 0:
                    return jsonify({"msg": "el url ya está usado"}), 400
            else:
                url = generate_url()

            concurso = Concurso(
                nombre=nombre,
                f_inicio=datetime.strptime(f_inicio,'%Y-%m-%d %H:%M:%S'),
                f_fin=datetime.strptime(f_fin,'%Y-%m-%d %H:%M:%S'),
                valor_paga=valor_paga,
                guion=guion,
                imagen_base64=imagen,
                url=url,
                recomendaciones=recomendaciones,
                user_id=user.id
                )
            db.session.add(concurso)
            db.session.commit()
            return concursoSchema.dump(concurso),201
        else:
            #TODO put
            return jsonify({"msg":""}),200


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
        req = request.get_json()
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('valor_paga',None)
        recomendaciones = req.get('recomendaciones',None)
        imagen = req.get('imagen_base64',None)
        url = req.get('url',None)
        if nombre:
            concurso.nombre = nombre
        if f_inicio:
            concurso.f_inicio = datetime.strptime(f_inicio,'%Y-%m-%d %H:%M:%S')
        if f_fin:
            concurso.f_fin = datetime.strptime(f_fin,'%Y-%m-%d %H:%M:%S')
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
                return jsonify({"msg":"la url ya está en uso"}),400
        db.session.commit()
        return concursoSchema.dump(concurso),200
    else:
        db.session.delete(concurso)
        db.session.commit()
        return '',204


@app.route('/api/url/<string:concurso_url>', methods=['GET'])
def concursoUrl(concurso_url):
    concurso = db.session.query(Concurso).filter_by(url=url).first()
    if not concurso:
        return jsonify({"msg":"No existe ningun concurso con la url especificada"}),404
    return concursoSchema.dump(concurso),200


@app.route('/api/audio', methods=['POST'])
def audio():
    if 'file' not in request.files:
        return jsonify({"msg":"El archivo de audio es requerido"}),400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg":"El archivo de audio es requerido"}),400
    ext = extract_ext(file.filename)
    if allowed_file(ext):
        nombre = generate_filename()
        filename = '{}.{}'.format(nombre,ext)
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        archivo_voz = ArchivoVoz(
            archivo_original=path,
            nombre=nombre
            )
        db.session.add(archivo_voz)
        file.save(path)
        db.session.commit()
        return archivoVozSchema.dump(archivo_voz),201
    return jsonify({"msg":"Formato de archivo no soportado"}),400


@app.route('/api/voz', methods=['POST'])
def voz():
    #TODO Asignar fecha creaciòn desde el servidor (maybe)
    f_creacion = req.get('f_creacion', None)
    email = req.get('email', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    observaciones = req.get('observaciones',None)
    archivo_id = req.get('archivo_id',None)
    concurso_id = req.get('concurso_id',None)
    
    Concurso.query.get_or_404(concurso_id)
    ArchivoVoz.query.get_or_404(archivo_id)

    voz = Voz(
        f_creacion=f_creacion,
        email=email,
        nombres=nombres,
        apellidos=apellidos,
        observaciones=observaciones,
        archivo_id=archivo_id,
        concurso_id=concurso_id,
        )
    db.session.commit()
    vozSchema.dump(voz)


if __name__ == '__main__':
    app.run(debug=True)
