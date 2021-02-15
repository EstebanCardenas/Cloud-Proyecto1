import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import PostulacionConcurso from './PostulacionConcurso';
import ReactAudioPlayer from 'react-audio-player';
import ReactHowlerPlayer from 'react-howler-player';

import Button from '@material-ui/core/Button';

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

export default function VisualizarConcurso() {
    const classes = useStyles();
    const [concurso, setConcurso] = useState({})
    const [openPostulacion, setOpenPostulacion] = useState(false)

    useEffect(() => {
        async function getConcurso(){
            //const concurso_url = sessionStorage.getItem('concurso_url')
            const concurso_url = 0
            fetch('/api/url/'+concurso_url)
            .then(resp => resp.json())
            .then(json => {
                console.log(json)
                setConcurso({
                    nombre : json.nombre,
                    f_inicio : json.f_inicio,
                    f_fin : json.f_fin,
                    valor_paga : json.valor_paga,
                    guion : json.guion,
                    recomendaciones : json.recomendaciones
                })
            })
        }
        getConcurso()
    })

    return <div>
        <Button
            variant="contained"
            color="primary"
            type="submit"
            className={classes.button}
            onClick = {() => {setOpenPostulacion(true)}}
        >
            Postularme
        </Button>

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
                        />
                    </div>
                </Fade>
        </Modal>
        <ReactAudioPlayer
                    src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                    onPlay={e => console.log("onPlay")}
                    controls
                />
                <ReactHowlerPlayer 
                    src={["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"]}
                    isDark = {true}
                />
</div>;
}