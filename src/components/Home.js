import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

const useStyles = makeStyles((theme) => ({
    '@global': {
        ul: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        },
    },
    heroContent: {
        padding: theme.spacing(8, 0, 6),
    }
}))

export default function Home() {
    const classes = useStyles()

    return (
        <React.Fragment>
            <CssBaseline />
            <Container maxWidth="sm" component="main" className={classes.heroContent}>
                <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
                    Super Voices
                </Typography>
                <Typography variant="h5" align="center" color="textSecondary" component="p">
                    Super Voices es un SaaS que te permite realizar concursos fácilmente para encontrar las mejores
                    voces para tus anuncios publicitarios. Regístrate o ingresa para configurar los concursos de voces
                    de tu empresa!
                </Typography>
            </Container>
        </React.Fragment>
    )
}