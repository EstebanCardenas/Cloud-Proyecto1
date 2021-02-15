import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Evento from './Concurso'
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import TextField from '@material-ui/core/TextField';

import ImageUploader from 'react-images-upload';

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(2),
    },
    heroContent: {
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(8, 0, 6),
    },
    heroButtons: {
        marginTop: theme.spacing(4),
    },
    cardGrid: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    cardMedia: {
        paddingTop: '56.25%', // 16:9
    },
    cardContent: {
        flexGrow: 1,
    },
    footer: {
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(6),
    },
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    root: {
        '& .MuiTextField-root': {
          margin: theme.spacing(1),
          width: '25ch',
        },
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 180,
        marginLeft: 12
      },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    button: {
        marginTop: theme.spacing(3),
        marginLeft: theme.spacing(1),
        float: 'right'
    },
}))

export default function Concursos() {
    const classes = useStyles();
    const [eventos, setEventos] = useState([])
    //estado para nuevo evento
    const [evtNombre, setEvtNombre] = useState("")
    const [evtURLConcurso, setEvtURLConcurso] = useState("")
    const [evtImagen, setEvtImagen] = useState("")
    const [evtGuion, setEvtGuion] = useState("")
    const [evtRecomendaciones, setEvtRecomendaciones] = useState("")
    const [evtPago, setEvtPago] = useState("")
    const [evtFechaInicio, setEvtFechaInicio] = useState("")
    const [evtFechaFin, setEvtFechaFin] = useState("")

    //modal
    const [open, setOpen] = useState(false)

    //onMount
    useEffect(() => {
        const token = localStorage.getItem("access_token")
        if (token) {
            fetch(`/api/concurso`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(resp => {
                if (resp["status"] === 200)
                    return resp.json()
            })
            .then(json => {
                if (json) {
                    setEventos(json)
                    console.log(json)
                } else {
                    alert("No se pudieron obtener los concursos")
                }
            })
            .catch(err => {
                console.log(err)
                alert(`Error: ${err}`)
            })
        } else {
            alert("Haz login para gestionar tus eventos")
        }
    }, [])

    function crearConcurso(evt) {
        evt.preventDefault()
        const token = localStorage.getItem("token")
        if (!token) {
            alert("Haz login para crear un concurso")
            return
        }
        const evtDatos = {
            nombre: evtNombre,
            url: evtURLConcurso,
            f_inicio: new Date(evtFechaInicio).getTime(),
            f_fin: new Date(evtFechaFin).getTime(),
            valor_paga: evtPago,
            guion: evtGuion,
            recomendaciones: evtRecomendaciones,
            imagen: evtImagen
        }
        const url = `/api/concurso/`
        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(evtDatos)
        })
        .then(resp => {
            return resp.json()
        })
        .then(json => {
            if (json['error'])
                alert(`Error: ${json['error']}`)
            else {
                let newArr = [...eventos]
                newArr.unshift({
                    id: json["id"],
                    nombre: evtNombre,
                    url_concurso: evtURLConcurso,
                    imagen: evtImagen,
                    guion: evtGuion,
                    recomendaciones: evtRecomendaciones,
                    pago: evtPago,
                    f_inicio: evtFechaInicio,
                    f_fin: evtFechaFin
                })
                setEventos(newArr)
                alert ("Concurso creado!")
                setOpen(false)
            }
        })
        .catch(err => console.log(err))
    }

    return (
        <React.Fragment>
            <CssBaseline />
            <main>
            <div className={classes.heroContent}>
                <Container maxWidth="sm">
                <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
                    Gestor de Concursos
                </Typography>
                <Typography variant="h5" align="center" color="textSecondary" paragraph>
                    Visualiza, crea y edita tus concursos.
                </Typography>
                <div className={classes.heroButtons}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        justify="center"
                        onClick={() => setOpen(true)}
                        style={{"marginLeft": "180px"}}
                    >
                        Crea un Concurso
                    </Button>
                    {/* Modal CREAR CONCURSO */}
                    <Modal
                        aria-labelledby="transition-modal-title"
                        aria-describedby="transition-modal-description"
                        className={classes.modal}
                        open={open}
                        onClose={() => setOpen(false)}
                        closeAfterTransition
                        BackdropComponent={Backdrop}
                        BackdropProps={{
                            timeout: 500,
                        }}
                    >
                        <Fade in={open}>
                        <div className={classes.paper}>
                            <h1 id="transition-modal-title">Detalles del Concurso:</h1>
                            <form onSubmit={crearConcurso}>
                                <div>
                                <Grid container spacing={3}>
                                    {/* Nombre */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        id="nombre"
                                        name="nombre"
                                        label="Nombre"
                                        fullWidth
                                        autoComplete="given-name"
                                        value={evtNombre}
                                        onChange={evt => setEvtNombre(evt.target.value)}
                                    />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id='urlInput'
                                        label='URL del concurso' 
                                        type='text' 
                                        fullWidth
                                        autoComplete="family-name"
                                        value={evtURLConcurso}
                                        onChange={evt => setEvtURLConcurso(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Imagen */}
                                    <Grid item xs={12}>
                                        <div> 
                                        <ImageUploader 
                                        key='image-uploader'
                                        fileContainerStyle = {{height:'100px',width:'200px'}}
                                        withIcon={true}
                                        singleImage={true}
                                        withPreview={true}
                                        label='Máximo tamaño 5MB'
                                        buttonText='Seleccione la imagen del concurso'
                                        onChange={event=>console.log(event)}
                                        imgExtension={['.jpg','.png','.jpeg']}
                                        maxFileSize={5242880}>
                                        </ImageUploader>
                                        </div>
                                    </Grid>
                                    {/* Fecha Inicio */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        id="f-inicio"
                                        name="f-inicio"
                                        label="Fecha de Inicio"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        value={evtFechaInicio}
                                        onChange={evt => setEvtFechaInicio(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Fecha Fin */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        id="f-fin"
                                        name="f-fin"
                                        label="Fecha de Fin"
                                        type="datetime-local"
                                        fullWidth
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        value={evtFechaFin}
                                        onChange={evt => setEvtFechaFin(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Guión */}
                                    <Grid item xs={12}>
                                    <TextField
                                        required
                                        id="guion"
                                        name="guion"
                                        label="Guión"
                                        fullWidth
                                        multiline
                                        rowsMax={5}
                                        //autoComplete="shipping address-line1"
                                        value={evtGuion}
                                        onChange={evt => setEvtGuion(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Recomendaciones */}
                                    <Grid item xs={12}>
                                    <TextField
                                        required
                                        id="recomendaciones"
                                        name="recomendaciones"
                                        label="Recomendaciones"
                                        fullWidth
                                        multiline
                                        rowsMax={5}
                                        //autoComplete="shipping address-line1"
                                        value={evtRecomendaciones}
                                        onChange={evt => setEvtRecomendaciones(evt.target.value)}
                                    />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                    {/* Pago */}
                                    <TextField
                                        id="pago"
                                        name="pago"
                                        label="Pago"
                                        type="number"
                                        required
                                        value={evtPago}
                                        onChange={evt => setEvtPago(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Submit */}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        className={classes.button}
                                    >
                                        Crear!
                                    </Button>
                                </Grid>
                                </div>
                            </form>
                        </div>
                        </Fade>
                    </Modal>
                </div>
                </Container>
            </div>
            <Container className={classes.cardGrid} maxWidth="md">
                <Grid container spacing={4}>
                {eventos.length ? eventos.map((evt, idx) => (
                    <Evento
                        key={idx}
                        classes={classes}
                        eventos={eventos}
                        setEventos={setEventos}
                        ind={idx}
                        evtId={evt.id}

                        nombre={evt.nombre}
                        url_concurso={evt.url_concurso}
                        imagen={evt.imagen}
                        guion={evt.guion}
                        recomendaciones={evt.recomendaciones}
                        pago={evt.pago}
                        f_inicio={evt.f_inicio}
                        f_fin={evt.f_fin}
                    />
                )) : ""}
                </Grid>
            </Container>
            </main>
        </React.Fragment>
    )
}