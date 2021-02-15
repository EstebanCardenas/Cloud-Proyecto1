import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import { useState } from 'react';
import TextField from '@material-ui/core/TextField';

export default function Evento(props) {
    //hooks
    const [openVer, setOpenVer] = useState(false)
    const [openEditar, setOpenEditar] = useState(false)

    const [evtNombre, setEvtNombre] = useState(props.nombre)
    const [evtImagen, setEvtImagen] = useState(props.imagen)
    const [evtGuion, setEvtGuion] = useState(props.guion)
    const [evtRecomendaciones, setEvtRecomendaciones] = useState(props.recomendaciones)
    const [evtPago, setEvtPago] = useState(props.valor_paga)
    const [evtFechaInicio, setEvtFechaInicio] = useState(props.f_inicio)
    const [evtFechaFin, setEvtFechaFin] = useState(props.f_fin)

    const [progress, setProgress] = useState('getUpload')
    const [url, setImageURL] = useState(undefined)
    const [errorMessage, setErrorMessage] = useState('')

    const content = () => {
        switch(progress){
            case 'getUpload':
                return <div>Please upload an image</div>
            case 'uploading':
                return <div>Uploading</div>
            case 'uploaded':
                return <img src={url} alt='uploaded' />
            case 'uploadError':
                return (
                    <>
                        <div>Error message = {errorMessage}</div>
                        <div>Please upload an image</div>
                    </>
                )
        }
    }

    //funciones
    function eliminarFront() {
        let newArr = [...props.concursos]
        let rmvIdx = (a, idx) => a.slice(0,idx).concat(a.slice(idx+1, a.length))
        props.setConcursos(rmvIdx(newArr, props.ind))
    }

    function eliminar() {
        const token = localStorage.getItem("access_token")
        if (!token)
            return
        const url = `/api/concursos/${props.evtId}`
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(resp => resp["status"])
        .then(status => {
            if (status !== 204) {
                alert(`Error: No se pudo eliminar el concurso`)
                return
            }
            eliminarFront()
        })
        .catch(err => {
            alert(`Error: ${err}`)
        })
    }

    function darConcursosModificados() {
        const newEvs = [...props.concursos]
        const newEv = {}
        if (evtNombre !== props.nombre) {
            newEvs[props.ind].nombre = evtNombre
            newEv["nombre"] = evtNombre
        }
        if (evtImagen !== props.imagen) {
            newEvs[props.ind].imagen = evtImagen
            newEv["imagen"] = evtImagen
        }
        if (evtGuion !== props.guion) {
            newEvs[props.ind].guion = evtGuion
            newEv["guion"] = evtGuion
        }
        if (evtRecomendaciones !== props.recomendaciones) {
            newEvs[props.ind].recomendaciones = evtRecomendaciones
            newEv["recomendaciones"] = evtRecomendaciones
        }
        if (evtPago !== props.valor_paga) {
            newEvs[props.ind].valor_paga = evtPago
            newEv["valor_paga"] = evtPago
        }
        if (evtFechaInicio !== props.f_inicio) {
            let date = new Date(evtFechaInicio)
            if (date <= new Date()) {
                alert("La fecha de inicio es menor o igual a la fecha actual")
                return
            }
            if (date >= new Date(evtFechaFin)) {
                alert("La fecha de inicio es mayor o igual a la fecha de fin")
                return
            }
            newEvs[props.ind].f_inicio = evtFechaInicio
            newEv["f_inicio"] = evtFechaInicio
        }
        if (evtFechaFin !== props.f_fin) {
            if (new Date(evtFechaFin) <= new Date(evtFechaInicio)) {
                alert("La fecha de fin es menor o igual a la de inicio")
                return
            }
            newEvs[props.ind].f_fin = evtFechaFin
            newEv["f_fin"] = evtFechaFin
        }
        //Devolver modificado
        return Object.keys(newEv).length ? [newEvs, newEv] : []
    }

    function editarEvento(evt) {
        evt.preventDefault()
        const token = localStorage.getItem("access_token")
        //validación
        if (!token)
            return
        const mod = darConcursosModificados()
        if (!mod)
            return
        //fetch
        if (mod.length) {
            const newEv = mod[1]
            fetch(`/api/concursos/${props.evtId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newEv)
            })
            .then(resp => [resp.json(), resp["status"]])
            .then(resp => {
                const json = resp[0]
                const status = resp[1]
                if (status !== 200) {
                    alert(`Error: ${json['msg']}`)
                    return
                }
                //actualizar front
                props.setConcursos(mod[0])
                alert("Evento actualizado!")
                setOpenEditar(false)
            })
            .catch(err => {
                console.log(err)
                alert(`Error: ${err}`)
            })
        } else {
            alert("No se ha modificado ningún atributo")
        }
    }

    return (
        <Grid item xs={12} sm={6} md={4}>
            <Card>
            <CardHeader
                title={props.nombre}
                titleTypographyProps={{ align: 'center' }}
                subheaderTypographyProps={{ align: 'center' }}
                className={props.classes.classHeader}
            />
            <CardContent>
                {/* <Typography variant="h6">
                    <b>Categoría:</b> {props.categoria[0].toUpperCase() + props.categoria.slice(1).toLowerCase()}
                </Typography>
                <Typography variant="h6">
                    <b>Imagen:</b> {props.imagen[0].toUpperCase() + props.imagen.slice(1).toLowerCase()}
                </Typography> */}
                <Typography variant="h6">
                    <b>Nombre:</b> {props.nombre[0].toUpperCase() + props.nombre.slice(1).toLowerCase()}
                </Typography>
            </CardContent>
            <CardActions>
                {/* Modal Ver */}
                <Button size="small" color="primary" onClick={() => setOpenVer(true)}>
                    Ver
                </Button>
                <Modal
                    aria-labelledby="transition-modal-verEvento"
                    className={props.classes.modal}
                    open={openVer}
                    onClose={() => setOpenVer(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                        timeout: 500,
                    }}
                >
                    <Fade in={openVer}>
                        <div className={props.classes.paper}>
                            <h1 id="transition-modal-title">Detalles del Evento:</h1>
                            <div>
                                <Grid container spacing={3}>
                                    {/* Nombre */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="ver-nombre"
                                        name="ver-nombre"
                                        label="Nombre"
                                        value={props.nombre}
                                        fullWidth
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    {/* Imagen */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="ver-imagen"
                                        name="ver-imagen"
                                        label="Imagen"
                                        value={props.imagen}
                                        fullWidth
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    {/* Fecha Inicio */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="ver-f-inicio"
                                        name="ver-f-inicio"
                                        label="Fecha de Inicio"
                                        type="datetime-local"
                                        fullWidth
                                        value={props.f_inicio}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    {/* Fecha Fin */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="ver-f-fin"
                                        name="ver-f-fin"
                                        label="Fecha de Fin"
                                        type="datetime-local"
                                        fullWidth
                                        value={props.f_fin}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    {/* Guión */}
                                    <Grid item xs={12}>
                                    <TextField
                                        required
                                        id="ver-guion"
                                        name="ver-guion"
                                        label="Guión"
                                        fullWidth
                                        multiline
                                        rowsMax={5}
                                        value={props.guion}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    {/* Recomendaciones */}
                                    <Grid item xs={12}>
                                    <TextField
                                        required
                                        id="ver-recomendaciones"
                                        name="ver-recomendaciones"
                                        label="Recomendaciones"
                                        fullWidth
                                        multiline
                                        rowsMax={5}
                                        //autoComplete="shipping address-line1"
                                        value={props.recomendaciones}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                    {/* Pago */}
                                    <TextField
                                        id="ver-pago"
                                        name="ver-pago"
                                        label="Pago"
                                        type="number"
                                        required
                                        value={props.valor_paga}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                    </Grid>
                                </Grid>
                                </div>
                        </div>
                    </Fade>
                </Modal>
                {/* Modal Editar */}
                <Button size="small" color="primary" onClick={() => setOpenEditar(true)}>
                    Editar
                </Button>
                <Modal
                    aria-labelledby="transition-modal-editar"
                    className={props.classes.modal}
                    open={openEditar}
                    onClose={() => setOpenEditar(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                        timeout: 500,
                    }}
                >
                    <Fade in={openEditar}>
                        <div className={props.classes.paper}>
                        <h1 id="transition-modal-title">Editar Evento:</h1>
                            <form onSubmit={editarEvento}>
                                <div>
                                <Grid container spacing={3}>
                                    {/* Nombre */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="nombre"
                                        name="nombre"
                                        label="Nombre"
                                        fullWidth
                                        autoComplete="given-name"
                                        value={evtNombre}
                                        onChange={evt => setEvtNombre(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Imagen */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="imagen"
                                        name="imagen"
                                        label="Imagen"
                                        fullWidth
                                        autoComplete="family-name"
                                        value={evtImagen}
                                        onChange={evt => setEvtImagen(evt.target.value)}
                                    />
                                    </Grid>
                                    {/* Fecha Inicio */}
                                    <Grid item xs={12} sm={6}>
                                    <TextField
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
                                        className={props.classes.button}
                                    >
                                        Editar!
                                    </Button>
                                </Grid>
                                </div>
                            </form>
                        </div>
                    </Fade>
                </Modal>
                {/* Eliminar Evento */}
                <Button size="small" color="secondary" onClick={eliminar}>
                    Eliminar
                </Button>
            </CardActions>
            </Card>
        </Grid>
    )
}