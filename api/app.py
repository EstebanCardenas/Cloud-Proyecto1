import random, string
import os
from flask import Flask, request, jsonify, json
from flask_cors.extension import CORS
from flask_praetorian import Praetorian, auth_required, current_user
from werkzeug.utils import secure_filename
#modelos
from models import *
from datetime import datetime

UPLOAD_FOLDER = './originales/'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

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
    db.create_all()


def generate_url():
    characters = string.ascii_letters + string.digits
    url = ''.join(random.choices(characters, k=16))
    while db.session.query(Concurso).filter_by(url=url).count() > 0:
        url = ''.join(random.choices(characters, k=16))
    return url


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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
        return {"msg": "El email ya está registrado"}, 400


@app.route('/api/concurso', methods=['GET','POST'])
@auth_required
def concursos():
    user = current_user()
    if request.method == 'GET':
        concursos = Concurso.query.filter_by(user_id=user.id)
        return concursosSchema.dumps(concursos), 200
    elif request.method == 'POST':
        req = json.dumps(request.data)
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('valor_paga',None)
        recomendaciones = req.get('recomendaciones',None)
        imagen = req.get('imagen_base64',None)
        url = req.get('url',None)
        #TODO URL
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
        return concursoSchema.dump(concurso),201


@app.route('/api/concurso/<int:concurso_id>', methods=['GET','PUT','DELETE'])
@auth_required
def concurso(concurso_id):
    user = current_user()
    concurso = Concurso.query.get_or_404(concurso_id)
    if user.id != concurso.user_id:
        return {"msg":"Solo se pueden acceder a concursos propios"},403
    if request.method == 'GET':
        return concursoSchema.dump(concurso)
    elif request.method == 'PUT':
        #TODO URL
        req = request.get_json()
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('valor_paga',None)
        recomendaciones = req.get('recomendaciones',None)
        if 'nombre' in req:
            concurso.nombre = req['nombre']
        if 'f_inicio' in req:
            concurso.f_inicio = req['f_inicio']
        if 'f_fin' in req:
            concurso.f_fin = req['f_fin']
        if 'valor_paga' in req:
            concurso.valor_paga = req['valor_paga']
        if 'guion' in req:
            concurso.guion = req['guion']
        if 'recomendaciones' in req:
            concurso.recomendaciones = req['recomendaciones']
        
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
    if allowed_file(file.filename):
        filename = secure_filename(file.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'],'id/', filename)
        archivo_voz = ArchivoVoz(
            archivo_original=filename,
            convertido=False
        )
        path_real = os.path.join(app.config['UPLOAD_FOLDER'],'{}/'.format(archivo_voz.id), filename)
        archivo_voz.archivo_original = path_real
        file.save(path_real)
        db.session.commit()
        return archivoVozSchema.dump(archivo_voz)


@app.route('/api/voz', methods=['POST'])
def voz():
    f_creacion = datetime.now()
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
    app.run()
