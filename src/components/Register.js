import React, {useState} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

const useStyles = makeStyles((theme) => ({
    paper: {
      marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    avatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.main,
    },
    form: {
      width: '100%',
      marginTop: theme.spacing(1),
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
}))

export default function Register(props) {
    const classes = useStyles()

    const [nombres, setNombres] = useState("")
    const [apellidos, setApellidos] = useState("")
    const [mail, setMail] = useState("")
    const [pass, setPass] = useState("")
    const [passConfirm, setPassConfirm] = useState("")

    function register(evt) {
        evt.preventDefault()
        //validación
        if (!mail.includes('@')) {
            alert("Introduce un correo válido")
            return
        }
        if (pass !== passConfirm) {
            alert("Las contraseñas no coinciden")
            return
        }
        //fetch
        fetch('/api/register', {
            method: "POST",
            body: JSON.stringify({
              email: mail,
              password: pass,
              nombres: nombres,
              apellidos: apellidos,
            })
        })
        .then(resp => {
            if (resp["status"] === 400) {
                alert(`Registro fallido: el correo ya está registrado`)
            } else {
                return resp.json()
            }
        })
        .then(json => {
            if (json === undefined)
                return
            alert("Registro exitoso!")
            props.setOpen(false)
        })
        .catch(err => {
            console.log(err)
            alert(`Registro fallido: ${err}`)
        })
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Registro
                </Typography>
                <form className={classes.form} onSubmit={register}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="nombres"
                    id="nombres"
                    label="Nombres"
                    value={nombres}
                    onChange={evt => setNombres(evt.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="apellidos"
                    id="apellidos"
                    label="Apellidos"
                    value={apellidos}
                    onChange={evt => setApellidos(evt.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="mail"
                    id="mail"
                    label="Correo"
                    value={mail}
                    onChange={evt => setMail(evt.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    type="password"
                    id="password"
                    label="Contraseña"
                    autoComplete="current-password"
                    value={pass}
                    onChange={evt => setPass(evt.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="confirm"
                    type="password"
                    id="confirm"
                    label="Confirmar Contraseña"
                    autoComplete="current-password"
                    value={passConfirm}
                    onChange={evt => setPassConfirm(evt.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                >
                    Registrarse
                </Button>
                </form>
            </div>
        </Container>
    )
}