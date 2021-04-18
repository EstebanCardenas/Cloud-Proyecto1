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
    cardHeader: {
        backgroundColor:
          theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
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
}))

export default function Concursos() {
    const classes = useStyles();
    const [concursos, setConcursos] = useState([])
    //estado para nuevo evento
    const [evtNombre, setEvtNombre] = useState("")
    const [evtURLConcurso, setEvtURLConcurso] = useState("")
    const [evtImagen, setEvtImagen] = useState("")
    const [evtImagen64, setEvtImagen64] = useState("")
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
            fetch(`/api/concursos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(resp => {
                if (resp["status"] === 200)
                    return resp.json()
                else if (resp["status"] === 404)
                    return []
            })
            .then(json => {
                if (json) {
                    setConcursos(json)
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

    function convertirBase64(archivo) {
        console.log(archivo)
        var reader = new FileReader();
        reader.readAsDataURL(archivo[0]);
        reader.onload=function(){
            var base64 = reader.result;
            //console.log(base64)
            setEvtImagen64(base64)
        }
    }

    function crearConcurso(evt) {
        evt.preventDefault()
        const token = localStorage.getItem("access_token")
        //validación
        if (!token) {
            alert("Haz login para crear un concurso")
            return
        }
        if (new Date(evtFechaInicio) <= new Date()) {
            alert("La fecha de inicio es menor o igual a la actual")
            return
        }
        if (new Date(evtFechaInicio) >= new Date(evtFechaFin)) {
            alert("La fecha de inicio es mayor o igual a la de fin")
            return
        }
        if (evtPago <= 0) {
            alert("Introduce un valor de pago válido")
            return
        }
        //fetch
        const evtDatos = {
            nombre: evtNombre,
            f_inicio: evtFechaInicio,
            f_fin: evtFechaFin,
            valor_paga: evtPago,
            guion: evtGuion,
            recomendaciones: evtRecomendaciones
        }
        if (evtImagen64 !== '')
            evtDatos["imagen_base64"] = evtImagen64
        if (evtURLConcurso !== '')
            evtDatos["url"] = evtURLConcurso
        const url = `/api/concursos`
        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(evtDatos)
        })
        .then(resp => {
            if (resp["status"] !== 201) {
                alert(`No se pudo crear el concurso`)
                return
            }
            return resp.json()
        })
        .then(json => {            
            if (json) {
                let newArr = [...concursos]
                const newUrl = evtURLConcurso !== "" ? evtURLConcurso : json["url"]
                newArr.unshift({
                    id: json["_id"],
                    nombre: evtNombre,
                    url: newUrl,
                    imagen: evtImagen,
                    guion: evtGuion,
                    recomendaciones: evtRecomendaciones,
                    valor_paga: evtPago,
                    f_inicio: evtFechaInicio,
                    f_fin: evtFechaFin
                })
                setConcursos(newArr)
                alert("Concurso creado!")
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
                        style={{"marginLeft": "190px"}}
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
                                <Grid container spacing={2}>
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
                                        id="url"
                                        name ="url"
                                        label="URL del concurso" 
                                        type='text' 
                                        fullWidth
                                        autoComplete="url-name"
                                        value={evtURLConcurso}
                                        onChange={evt => setEvtURLConcurso(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Imagen */}
                                    <Grid item xs={12} style={{"marginTop": "30px", "marginBottom": "30px"}}>
                                        <ImageUploader 
                                            key='image-uploader'
                                            fileContainerStyle = {{height:'100px',width:'150px'}}
                                            withIcon={true}
                                            singleImage={true}
                                            withPreview={true}
                                            label='Máximo tamaño 5MB'
                                            buttonText='Selecciona la imagen del concurso'
                                            onChange={event=>convertirBase64(event)}
                                            imgExtension={['.jpg','.png','.jpeg']}
                                            maxFileSize={5242880}>
                                        </ImageUploader>
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
                                    <Grid item xs={12} sm={6}>
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
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        className={classes.button}
                                        style={{"marginLeft": "20px", "marginTop": "12px"}}
                                    >
                                        Crear!
                                    </Button>
                                    </Grid>
                                   
                                    {/* Submit */}
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
                {concursos.length ? concursos.map((evt, idx) => (
                    <Evento
                        key={idx}
                        classes={classes}
                        concursos={concursos}
                        setConcursos={setConcursos}
                        ind={idx}
                        evtId={evt._id}

                        nombre={evt.nombre}
                        url={evt.url}
                        imagen={evt.imagen_base64}
                        guion={evt.guion}
                        recomendaciones={evt.recomendaciones}
                        valor_paga={evt.valor_paga}
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