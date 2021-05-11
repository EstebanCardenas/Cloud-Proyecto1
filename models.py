# from mongoengine import *
# from werkzeug.security import check_password_hash, generate_password_hash
#
# class UserAdmin(Document):
#     nombres = StringField()
#     apellidos = StringField()
#     email = StringField()
#     contrasena = StringField()
#
#     def set_password(self, password):
#         self.contrasena = generate_password_hash(password)
#
#     def check_password(self, password):
#         return check_password_hash(self.contrasena, password)
#
# class Concurso(Document):
#     nombre = StringField()
#     imagen_base64 = StringField()
#     url = StringField()
#     f_inicio = DateTimeField()
#     f_fin = DateTimeField()
#     valor_paga = IntField()
#     guion = StringField()
#     recomendaciones = StringField()
#     user = ReferenceField(UserAdmin)
#
# class ArchivoVoz(Document):
#     archivo_original = StringField()
#     archivo_convertido = StringField()
#     convertido = BooleanField()
#
# class Voz(Document):
#     f_creacion = DateTimeField()
#     email = StringField()
#     nombres = StringField()
#     apellidos = StringField()
#     observaciones = StringField()
#     archivo = ReferenceField(ArchivoVoz)
#     concurso = ReferenceField(Concurso)
