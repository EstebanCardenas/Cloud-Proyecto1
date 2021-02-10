from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

db = SQLAlchemy()
ma = Marshmallow()

#Usuario admin
class UserAdmin(db.Model):
    id = db.Column(db.Integer, primary_key=1)
    nombres = db.Column(db.String(220), nullable=0)
    apellidos = db.Column(db.String(220), nullable=0)
    email = db.Column(db.String(120), nullable=0, unique=1)
    contrasena = db.Column(db.String(120), nullable=0)
    #relaciones
    concursos = db.relationship('Concurso', backref='UserAdmin', lazy=1)

    @property
    def rolenames(self):
        return []

    @property
    def password(self):
        return self.constrasena

    @classmethod
    def lookup(cls, email):
        return cls.query.filter_by(email=email).one_or_none()

    @classmethod
    def identify(cls, id):
        return cls.query.get(id)

    @property
    def identity(self):
        return self.id

    def is_valid(self):
        return True


class UserAdminSchema(ma.Schema):
    class Meta:
        fields = ("id", "nombres", "apellidos", "email")


userAdminSchema = UserAdminSchema()
usersAdminSchema = UserAdminSchema(many=1)


#Concurso
class Concurso(db.Model):
    id = db.Column(db.Integer, primary_key=1)
    nombre = db.Column(db.String(120), nullable=0)
    #TODO banner o imagen
    #TODO url única
    f_inicio = db.Column(db.DateTime, nullable=0)
    f_fin = db.Column(db.DateTime, nullable=0)
    valor_paga = db.Column(db.Integer, nullable=0)
    guion = db.Column(db.String(2000), nullable=0)
    recomendaciones = db.Column(db.String(2000), nullable=0)
    #relaciones
    user_id = db.Column(db.Integer, db.ForeignKey('UserAdmin.id'), nullable=0)
    voces = db.relationship('Voz', backref='Concurso', lazy=1)


class ConcursoSchema(ma.Schema):
    class Meta:
        fields = ("id", "nombre", "f_inicio", "f_fin", "valor_paga", "guion", "recomendaciones", "user_id")


concursoSchema = ConcursoSchema()
concursosSchema = ConcursoSchema(many=1)


#Voz
class Voz(db.Model):
    id = db.Column(db.Integer, primary_key=1)
    f_creacion = db.Column(db.DateTime, nullable=0)
    email = db.Column(db.String(120), nullable=0)
    nombres = db.Column(db.String(220), nullable=0)
    apellidos = db.Column(db.String(220), nullable=0)
    convertida = db.Column(db.Boolean, nullable=0) #estado de la voz
    observaciones = db.Column(db.String(1000))
    #TODO archivo_original
    #TODO archivo_convertida
    #relaciones
    concurso_id = db.Column(db.Integer, db.ForeignKey('Concurso.id'), nullable=0)


class VozSchema(ma.Schema):
    class Meta:
        fields = ("id", "f_creacion", "email", "nombres", "apellidos", "convertida", "observaciones", "concurso_id")
vozSchema = VozSchema()
vocesSchema = VozSchema(many=1)
