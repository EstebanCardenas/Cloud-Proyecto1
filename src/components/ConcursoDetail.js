import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Entrada from './Entrada';
import Pagination from '@material-ui/lab/Pagination';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function ConcursoDetail({match}) {
    //state
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(0)
    const [voces, setVoces] = useState([])
    const [fetched, setFetched] = useState(false)

    //onMount
    useEffect(() => {
        async function getAll() {
            const token = localStorage.getItem("access_token")
            if (!token) {
                alert("Haz login para acceder")
                return
            }
            const idx = match.url.search(/concurso/) + 9
            const concurso_id = match.url.slice(idx)
            let url = `/api/concursos/${concurso_id}/voces?page=${page}`
            let resp = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            let status = resp["status"]
            if (status !== 200) {
                if (status === 403)
                    alert("Debes ser el dueño del concurso para ver las voces")
                else
                    alert("No se pudieron obtener las voces")
                return
            }
            let json = await resp.json()
            setPages(json["total_pags"])
            let voces = json["voces"]
            for (let i=0; i<voces.length; i++) {
                const voz = voces[i]
                //archivo convertido
                let url = `/api/audio/${voz.archivo_id}?convertido=1`
                let respConv = await fetch(url)
                let statusConv = resp["status"]
                if (statusConv === 400) {
                    voces[i]["estado"] = "En proceso"
                } else if (statusConv === 200) {
                    const blob = await respConv.blob()
                    voces[i]["convertida"] = blob
                    voces[i]["estado"] = "Convertida"
                }
                //archivo sin convertir
                url = `/api/audio/${voz.archivo_id}?convertido=0`
                let respOr = await fetch(url)
                let statusOr = resp["status"]
                if (statusOr === 200) {
                    const blob = await respOr.blob()
                    voces[i]["original"] = blob
                }
            }
            setVoces(voces)
            setFetched(true)
        }
        getAll()
    }, [match, page])

    function renderVoces() {
        if (voces.length && fetched) {
            return (
                <div>
                    <Grid container spacing={3}>
                        {voces.map((voz,idx) => {
                            return (
                                <Grid item xs={12} sm={4} key={idx}>
                                    <Entrada
                                        voz={voz}
                                    />
                                </Grid>
                            )
                        })}
                    </Grid>
                    <div style={{
                        "display": "flex",
                        "justifyContent": "center",
                        "marginTop": "20px"
                    }}>
                        <Pagination count={pages} page={page} variant="outlined" color="primary" onChange={(ev, val) => setPage(val)} showFirstButton showLastButton/>
                    </div>
                </div>
            )
        }
        else if (!voces.length && fetched) {
            return (
                <div style={{
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "marginTop": "20px"
                }}>
                    <b>Aún no hay entradas para el concurso, cuando las haya aparecerán aquí</b>
                </div>
            )
        }
        else if (!fetched) {
            return (
                <div style={{
                    "display": "flex",
                    "justifyContent": "center",
                    "alignItems": "center",
                    "marginTop": "20px",
                    "flexDirection": "column",
                }}>
                    <div>
                        <b>Las voces se están cargando</b>
                    </div>
                    <div style={{"marginTop": "30px"}}>
                        <CircularProgress />
                    </div>
                </div>
            )
        }
    }

    return (
        <div>
            {renderVoces()}
        </div>
    )
}