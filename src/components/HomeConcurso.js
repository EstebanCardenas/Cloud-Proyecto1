import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import PostulacionConcurso from './PostulacionConcurso';
import ReactAudioPlayer from 'react-audio-player';
import ReactHowlerPlayer from 'react-howler-player';

import Button from '@material-ui/core/Button';
import { CssBaseline } from '@material-ui/core';

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
    toolbar: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'rgb(230,230,230)'
    },
    toolbarTitle: {
        flex: 1,
    },
    toolbarSecondary: {
        justifyContent: 'space-between',
        overflowX: 'auto',
    },
    toolbarLink: {
        padding: theme.spacing(1),
        flexShrink: 0,
    },
}))

export default function HomeConcurso({ match }) {
    const classes = useStyles()
    const [concurso, setConcurso] = useState({})
    const [audios, setAudios] = useState([])
    const [openPostulacion, setOpenPostulacion] = useState(false)
    const [concursoId, setConcursoId] = useState("")
    const [imageBase64, setImageBase64] = useState("")
    //paginación
    const [pags, setPags] = useState(0)
    const [page, setPage] = useState(1)

    //tabs
    const [tab, setTab] = useState(0)
    function a11yProps(index) {
        return {
          id: `simple-tab-${index}`,
          'aria-controls': `simple-tabpanel-${index}`,
        };
    }
    function TabPanel(props) {
        const { children, value, index, ...other } = props;
        
        return (
            <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            >
            {value === index && (
                <Box p={3}>
                <Typography>{children}</Typography>
                </Box>
            )}
            </div>
        );
    }

    useEffect(() => {
        async function getAll(){
            //get url
            const idx = match.url.search(/concurso/) + 9
            const url = match.url.slice(idx)

            //get concurso
            let resp = await fetch(`/api/url/${url}`)
            if (resp["status"] !== 200) {
                alert("No se encontró un concurso con la url especificada")
                return
            }
            let json = await resp.json()
            setConcurso(json)
            console.log(json)
            setConcursoId(json.id)
            //setImageBase64("data:image/jpeg;base64," + json.imagen_base64)
            //setImageBase64(window.atob(json.image_base64))
            //console.log(window.atob(json.image_base64))

            //get voces
            resp = await fetch(`/api/url/${url}/voces`)
            if (resp["status"] !== 200) {
                alert("No se pudieron obtener las voces para el concurso")
                return
            }
            json = await resp.json()
            if (json["total_pags"]) {
                const voces = json["voces"]
                //get audios
                const audios = []
                voces.forEach( async voz => {
                    let url = new URL(`/api/audio/${voz.archivo_id}`)
                    url.searchParams.append('convertido', 1)
                    resp = await fetch(url)
                    if (resp === 200) {
                        json = await resp.json()
                        console.log(json)
                    }
                })
                setPags(audios.length)
                setAudios(audios)
            }
        }
        getAll()
    }, [match.url])

    function handlePagChange(evt,val) {
        setPage(val)
    }

    function renderAudios() {
        if (pags) {
            return (
                <div style={{
                    "display": "flex",
                    "justifyContent": "center",
                    "marginTop": "20px"
                }}>
                    <Pagination count={pags} page={page} variant="outlined" color="primary" onChange={handlePagChange} showFirstButton showLastButton/>
                </div>
            )
        } else {
            return (
                <div style={{
                    "textAlign": "center",
                    "marginTop": "30px",
                    "fontFamily": "sans-serif",
                    "fontWeight": "bold"
                }}>
                    Las entradas del concurso aparecerán aquí
                </div>
            )
        }
    }

    function renderConcurso() {
        if (Object.keys(concurso).length) {
            return (
                <div>
                    {/* HEADER */}
                    <Toolbar className={classes.toolbar}>
                    <Typography
                        component="h2"
                        variant="h4"
                        color="inherit"
                        align="center"
                        noWrap
                        className={classes.toolbarTitle}
                    >
                        {concurso.nombre}
                    </Typography>
                    </Toolbar>
                    {/* BANNER */}
                    <div style={{"textAlign": "center", "margin": "30px 0px"}}>
                        <img
                            src={`data:image/jpeg;base64,${imageBase64}`}
                            alt='Banner'
                        />
                    </div>
                    {/* TABS */}
                    <div className={classes.root}>
                        <AppBar position="static">
                            <Tabs value={tab} onChange={(ev, val) => setTab(val)} aria-label="tabs info concurso" centered>
                                <Tab label="Fechas" {...a11yProps(0)} />
                                <Tab label="Valor a Pagar" {...a11yProps(1)} />
                                <Tab label="Guión" {...a11yProps(2)} />
                                <Tab label="Recomendaciones" {...a11yProps(3)} />
                            </Tabs>
                        </AppBar>
                        <div style={{"textAlign": "center"}}>
                            <TabPanel value={tab} index={0}>
                                <b>Fecha de Inicio:</b> {concurso.f_inicio.split("T")[0] + "/" + concurso.f_inicio.split("T")[1]} | <b>Fecha de Fin:</b> {concurso.f_fin.split("T")[0] + "/" + concurso.f_fin.split("T")[1]}
                            </TabPanel>
                            <TabPanel value={tab} index={1}>
                                <b>${concurso.valor_paga} COP</b>
                            </TabPanel>
                            <TabPanel value={tab} index={2}>
                                {concurso.guion}
                            </TabPanel>
                            <TabPanel value={tab} index={3}>
                                {concurso.recomendaciones}
                            </TabPanel>
                        </div>
                    </div>
                    {/* POSTULACIÓN */}
                    <div style={{"textAlign": "center", "marginTop": "20px"}}>
                        <Button
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                            onClick = {() => {
                                setOpenPostulacion(true)
                                setConcursoId(concursoId)
                            }}
                        >
                            Postularme
                        </Button>
                    </div>
                    <Modal
                        aria-labelledby="transition-modal-login"
                        className={classes.modal}
                        open={openPostulacion}
                        onClose={() => setOpenPostulacion(false)}
                        closeAfterTransition
                        BackdropComponent={Backdrop}
                        BackdropProps={{
                        timeout: 500,
                        }}
                    >
                        <Fade in={openPostulacion}>
                            <div className={classes.paper}>
                                <PostulacionConcurso 
                                    setOpen = {setOpenPostulacion}
                                    concursoId = {concursoId}
                                />
                            </div>
                        </Fade>
                    </Modal>
                    <br></br>
                    {/* AUDIOS */}
                    <Typography component="h1" variant="h4" align="center" color="textPrimary" gutterBottom style={{
                        "backgroundColor": "rgb(63,81,181)",
                        "padding": "20px 0px",
                        "color": "rgb(255,255,255)",
                        "fontFamily": "sans-serif",
                        "marginTop": "20px"
                    }}>
                        ENTRADAS
                    </Typography>
                    {renderAudios()}
                    {/* <ReactAudioPlayer
                        src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                        onPlay={e => console.log("onPlay")}
                        controls
                    />
                    <ReactHowlerPlayer 
                        src={["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"]}
                        isDark = {true}
                    /> */}
                </div>
            )
        } else {
            return (<div></div>)
        }
    }

    return renderConcurso()
}