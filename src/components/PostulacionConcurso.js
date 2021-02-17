import React, {useCallback, useState} from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import {useDropzone} from 'react-dropzone';

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

const allowedAudioFileTypes = ['audio/mpeg','audio/wav','audio/mp3','audio/ogg']

export default function Register(props) {
    const classes = useStyles()

    const [nombres, setNombres] = useState("")
    const [apellidos, setApellidos] = useState("")
    const [mail, setMail] = useState("")
    const [archivoVoz, setArchivoVoz] = useState(null)
    const [observaciones, setObservaciones] = useState("")

    const onDrop = useCallback(acceptedFiles => {
        console.log(acceptedFiles)
        if (allowedAudioFileTypes.includes(acceptedFiles[0].type)){
            setArchivoVoz(acceptedFiles[0])
        }
        else{
            alert('Formato de archivo no permitido: ' + acceptedFiles[0].type)
        }
      }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    async function register(evt) {
        evt.preventDefault()
        //validación
        if (!mail.includes('@')) {
            alert("Introduce un correo válido")
            return
        }
        // fetch envio audio
        var data = new FormData()
        data.append('file', archivoVoz)
        const response = await fetch('/api/audio', {
            method: "POST",
            body: data
        })
        const body = await response.json()
        console.log(body)
        // fetch crear registro base de datos
        const data2 = {
            email:mail,
            nombres:nombres,
            apellidos:apellidos,
            observaciones:observaciones,
            archivo_id:body.id,
            concurso_id:props.concursoId,
        }
        console.log(data2)
        const response2 = await fetch('/api/voz', {
            method: "POST",
            body: JSON.stringify(data2)
        })

        if (response2["status"] !== 201) {
            alert("No se pudo completar la postulación")
            return
        }
        const body2 = await response2.json()
        console.log(body2)
    }

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Postulación 
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
                    name="observaciones"
                    type="observaciones"
                    id="observaciones"
                    label="Observaciones"
                    autoComplete="current-observaciones"
                    value={observaciones}
                    onChange={evt => setObservaciones(evt.target.value)}
                />
                <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        Subir voz
                    </Button>
                </div>
                {archivoVoz && <div>
                    {archivoVoz.name}
                    </div>}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                >
                    Postularme
                </Button>
                </form>
            </div>
        </Container>
    )
}