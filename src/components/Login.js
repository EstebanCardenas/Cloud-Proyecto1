import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
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

export default function Login(props) {
    const classes = useStyles()

    const [mail, setMail] = useState("")
    const [pass, setPass] = useState("")
    
    function login(evt) {
        evt.preventDefault()
        //validar
        if (!mail.includes('@')) {
            alert("Introduce un correo válido")
            return
        }
        //fetch
        fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({
            email: mail,
            password: pass
        })
        })
        .then(resp => resp.json())
        .then(json => {
            if (json["status_code"] == 401) {
                alert("Login fallido: El correo o la contraseña son incorrectos")
                return
            }
            localStorage.setItem("mail", mail)
            localStorage.setItem("access_token", json["access_token"])
            props.setLogged(true)
            alert("Login exitoso!")
            props.setOpen(false)
        })
        .catch(err => {
            console.log(err)
            alert(`Login fallido: ${err}`)
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
                Login
            </Typography>
            <form className={classes.form} onSubmit={login}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="mail"
                    label="Correo"
                    id="mail"
                    value={mail}
                    onChange={evt => setMail(evt.target.value)}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Contraseña"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={pass}
                    onChange={evt => setPass(evt.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                >
                    Entrar
                </Button>
            </form>
        </div>
        </Container>
    )
}