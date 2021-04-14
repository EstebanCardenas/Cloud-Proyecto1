#from extensions import db, ma

#Usuario admin
# class UserAdmin(db.Model):
#     id = db.Column(db.Integer, primary_key=1)
#     nombres = db.Column(db.String(220), nullable=0)
#     apellidos = db.Column(db.String(220), nullable=0)
#     email = db.Column(db.String(120), nullable=0, unique=1)
#     contrasena = db.Column(db.String(300), nullable=0)
#     #relaciones
#     concursos = db.relationship('Concurso', backref='user_admin', lazy=1)
#
#     @property
#     def rolenames(self):
#         return []
#
#     @property
#     def password(self):
#         return self.contrasena
#
#     @classmethod
#     def lookup(cls, email):
#         return cls.query.filter_by(email=email).one_or_none()
#
#     @classmethod
#     def identify(cls, id):
#         return cls.query.get(id)
#
#     @property
#     def identity(self):
#         return self.id
#
#     def is_valid(self):
#         return True
#
#
# class UserAdminSchema(ma.Schema):
#     class Meta:
#         fields = ("id", "nombres", "apellidos", "email")
#
#
# userAdminSchema = UserAdminSchema()
# usersAdminSchema = UserAdminSchema(many=1)
#
#
# #Concurso
# class Concurso(db.Model):
#     id = db.Column(db.Integer, primary_key=1)
#     nombre = db.Column(db.String(120), nullable=0)
#     imagen_base64 = db.Column(db.Text, nullable=1)
#     url = db.Column(db.String(120), nullable=0, unique=1)
#     f_inicio = db.Column(db.DateTime, nullable=0)
#     f_fin = db.Column(db.DateTime, nullable=0)
#     valor_paga = db.Column(db.Integer, nullable=0)
#     guion = db.Column(db.String(2000), nullable=0)
#     recomendaciones = db.Column(db.String(2000), nullable=0)
#     #relaciones
#     user_id = db.Column(db.Integer, db.ForeignKey('user_admin.id'), nullable=0)
#     voces = db.relationship('Voz', backref='concurso', cascade="all, delete", lazy=1)
#
#
# class ConcursoSchema(ma.Schema):
#     class Meta:
#         fields = ("id", "nombre", "f_inicio", "f_fin", "url", "imagen_base64",
#                   "valor_paga", "guion", "recomendaciones", "user_id")
#
#
# concursoSchema = ConcursoSchema()
# concursosSchema = ConcursoSchema(many=1)
#
#
# #Voz
# class Voz(db.Model):
#     id = db.Column(db.Integer, primary_key=1)
#     f_creacion = db.Column(db.DateTime, nullable=0)
#     email = db.Column(db.String(120), nullable=0)
#     nombres = db.Column(db.String(220), nullable=0)
#     apellidos = db.Column(db.String(220), nullable=0)
#     observaciones = db.Column(db.String(1000))
#     archivo_id = db.Column(db.Integer, db.ForeignKey('archivo_voz.id'), nullable=0)
#     concurso_id = db.Column(db.Integer, db.ForeignKey('concurso.id'), nullable=0)
#
#
# class VozSchema(ma.Schema):
#     class Meta:
#         fields = ("id", "f_creacion", "email", "nombres", "apellidos", "convertida", "observaciones", "concurso_id", "archivo_id")
#
#
# class VozSchemaSeguro(ma.Schema):
#     class Meta:
#         fields = ("f_creacion", "archivo_id")
#
#
# vozSchema = VozSchema()
# vocesSchema = VozSchema(many=1)
# vocesSchemaSeguro = VozSchemaSeguro(many=1)
#
#
# class ArchivoVoz(db.Model):
#     id = db.Column(db.Integer, primary_key=1)
#     archivo_original = db.Column(db.String(120), nullable=1)
#     archivo_convertido = db.Column(db.String(120), nullable=1)
#     convertido = db.Column(db.Boolean, nullable=0, default=0)
#     voz = db.relationship('Voz', backref=db.backref('archivo_voz', cascade="all, delete"), uselist=False, lazy=1)
#
#
# class ArchivoVozSchema(ma.Schema):
#     class Meta:
#         fields = ("id", "convertido","archivo_original", "archivo_convertido")
#
#
# archivoVozSchema = ArchivoVozSchema()
# archivosVozSchema = ArchivoVozSchema(many=1)
