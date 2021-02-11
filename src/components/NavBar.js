import React, { useEffect, useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Link from '@material-ui/core/Link';
import Modal from '@material-ui/core/Modal';
import Fade from '@material-ui/core/Fade';
import Backdrop from '@material-ui/core/Backdrop';
import Login from './Login';
import Register from './Register';

const useStyles = makeStyles((theme) => ({
    '@global': {
        ul: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        },
    },
    appBar: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    toolbar: {
        flexWrap: 'wrap',
    },
    toolbarTitle: {
        flexGrow: 1,
    },
    link: {
        margin: theme.spacing(1, 1.5),
    },
    heroContent: {
        padding: theme.spacing(8, 0, 6),
    },
    cardHeader: {
        backgroundColor:
        theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
    },
    cardPricing: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        marginBottom: theme.spacing(2),
    },
    footer: {
        borderTop: `1px solid ${theme.palette.divider}`,
        marginTop: theme.spacing(8),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
        paddingTop: theme.spacing(6),
        paddingBottom: theme.spacing(6),
        },
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
}));

function Buttons(logged, classes) {
    const [openLogin, setOpenLogin] = useState(false)
    const [openRegister, setOpenRegister] = useState(false)

    if (!logged) {
        return (
            <div>
            {/* LOGIN */}
            <Button color="primary" variant="outlined" className={classes.link} onClick={() => setOpenLogin(true)}>
                Login
            </Button>
            <Modal
                aria-labelledby="transition-modal-login"
                className={classes.modal}
                open={openLogin}
                onClose={() => setOpenLogin(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                  timeout: 500,
                }}
            >
                <Fade in={openLogin}>
                    <div className={classes.paper}>
                        <Login />
                    </div>
                </Fade>
            </Modal>
            {/* REGISTRO */}
            <Button color="primary" variant="outlined" className={classes.link} onClick={() => setOpenRegister(true)}>
                Registro
            </Button>
            <Modal
                aria-labelledby="transition-modal-register"
                className={classes.modal}
                open={openRegister}
                onClose={() => setOpenRegister(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                  timeout: 500,
                }}
            >
                <Fade in={openRegister}>
                    <div className={classes.paper}>
                        <Register />
                    </div>
                </Fade>
            </Modal>
            </div>
        )
    } else {
        return (
            <Button href="#" color="primary" variant="outlined" className={classes.link}>
                Salir
            </Button>
        )
    }
}

function renderConcursos(classes) {
    return (
        <Link variant="button" color="textPrimary" href="#" className={classes.link}>
            Concursos
        </Link>
    )
}

export default function NavBar(props) {
    const classes = useStyles()

    return (
        <React.Fragment>
            <CssBaseline />
            <AppBar position="static" color="default" elevation={0} className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                <Typography variant="h6" color="inherit" noWrap className={classes.toolbarTitle}>
                    SuperVoices
                </Typography>
                <nav>
                    {props.logged ? renderConcursos(classes) : ""}
                </nav>
                {Buttons(props.logged, classes)}
                </Toolbar>
            </AppBar>
        </React.Fragment>
    )
}