import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Entrada from './Entrada';
import Pagination from '@material-ui/lab/Pagination';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Container } from '@material-ui/core';

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
            const url_voces = `/api/concursos/${concurso_id}/voces?page=${page}`
            const resp_voces = await fetch(url_voces, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            const status_voces = resp_voces["status"]
            if (status_voces !== 200) {
                if (status_voces === 403)
                    alert("Debes ser el dueño del concurso para ver las voces")
                else
                    alert("No se pudieron obtener las voces")
                return
            }
            const json_voces = await resp_voces.json()
            setPages(json_voces["total_pags"])
            const voces = json_voces["voces"]
            for (let i=0; i<voces.length; i++) {
                const voz = voces[i]
                //archivo convertido
                const url_conv = `/api/audio/${voz.archivo_id}?convertido=1`
                const resp_conv = await fetch(url_conv)
                const status_conv = resp_conv["status"]
                if (status_conv === 400) {
                    voces[i]["estado"] = "En proceso"
                } else if (status_conv === 200) {
                    const blob = await resp_conv.blob()
                    voces[i]["convertida"] = blob
                    voces[i]["estado"] = "Convertida"
                }
                //archivo sin convertir
                const url_noconv = `/api/audio/${voz.archivo_id}?convertido=0`
                const resp_noconv = await fetch(url_noconv)
                const status_noconv = resp_noconv["status"]
                if (status_noconv === 200) {
                    const blob = await resp_noconv.blob()
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
                <div style={{margin: "2rem"}}>
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