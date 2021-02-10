from flask import Flask, request, jsonify
from flask_cors.extension import CORS
from flask_praetorian import Praetorian, auth_required, current_user
#modelos
from models import *

app = Flask(__name__)
app.config['SECRET_KEY'] = 'top secret'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
CORS(app)
guard = Praetorian()

with app.app_context():
    db.init_app(app)
    ma.init_app(app)
    guard.init_app(app, UserAdmin)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/login', methods=['POST'])
def login():
    req = request.get_json()
    email = req.get('email', None)
    password = req.get('password', None)
    user = guard.authenticate(email, password)
    return jsonify({'access_token': guard.encode_jwt_token(user)}), 200


@app.route('/register', methods=['POST'])
def register():
    req = request.get_json()
    email = req.get('email', None)
    password = req.get('password', None)
    nombres = req.get('nombres',None)
    apellidos = req.get('apellidos',None)
    if not email or not password or not nombres or not apellidos:
        return jsonify({"msg": "Formulario incompleto"}), 400
    #TODO chequear email regex
    if db.session.query(User).filter_by(email=email).count() < 1:
        db.session.add(User(
            email=email,
            contrasena=guard.hash_password(password),
            nombres=nombres,
            apellidos=apellidos
            ))
        db.session.commit()
        return {"msg": "usuario creado"}, 201

    else:
        return {"msg": "el email ya está usado"}, 400


@app.route('/concurso', methods=['GET','POST'])
@auth_required
def concursos():
    user = current_user()
    req = request.get_json()
    if request.method == 'GET':
        return concursosSchema.dump(user.concursos),200
    else:
        nombre = req.get('nombre', None)
        f_inicio = req.get('f_inicio', None)
        f_fin = req.get('f_fin',None)
        valor_paga = req.get('valor_paga',None)
        guion = req.get('valor_paga',None)
        recomendaciones = req.get('recomendaciones',None)
        #TODO URL
        if not nombre or not f_inicio or not f_fin or \
            not valor_paga or not guion or not recomendaciones:
            return jsonify({"msg": "Formulario incompleto"}), 400
        concurso = Concurso(
            nombre=nombre,
            f_inicio=f_inicio,
            f_fin=f_fin,
            valor_paga=valor_paga,
            guion=guion,
            recomendaciones=recomendaciones,
            user_id=user.id
            )
        db.session.add(concurso)
        db.session.commit()
        return concursoSchema.dump(concurso),201


@app.route('/concurso/<int:concurso_id>', methods=['GET','PUT','DELETE'])
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



if __name__ == '__main__':
    app.run()
