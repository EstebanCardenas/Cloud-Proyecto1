import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Entrada from './Entrada';
import Pagination from '@material-ui/lab/Pagination';

export default function ConcursoDetail({match}) {
    //state
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(0)
    const [voces, setVoces] = useState([])

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
            let url = new URL(`http://localhost:5000/api/concursos/${concurso_id}/voces`)
            url.searchParams.append('page', page)
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
            for (let voz of voces) {
                //archivo convertido
                url = new URL(`http://localhost:5000/api/audio/${voz.archivo_id}`)
                url.searchParams.append('convertido', 1)
                resp = await fetch(url)
                status = resp["status"]
                if (status === 404) {
                    alert("Archivo de voz no encontrado")
                    return
                }
                if (status === 200) {
                    const blob = await resp.blob()
                    voz["convertida"] = blob
                }
                //archivo sin convertir
                url = new URL(`http://localhost:5000/api/audio/${voz.archivo_id}`)
                url.searchParams.append('convertido', 0)
                resp = await fetch(url)
                status = resp["status"]
                if (status === 404) {
                    alert("Archivo de voz no encontrado")
                    return
                }
                if (status === 200) {
                    const blob = await resp.blob()
                    voz["original"] = blob
                }
            }
            setVoces(voces)
        }
        getAll()
    }, [match, page])

    function renderVoces() {
        if (voces.length) {
            return (
                <div>
                    <Grid container spacing={3}>
                        {voces.map((voz,idx) => {
                            return(
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
        return (
            <div style={{
                "display": "flex",
                "justifyContent": "center",
                "alignItems": "center"
            }}>
                <b>Aún no hay entradas para el concurso</b>
            </div>
        )
    }

    return (
        <div>
            {renderVoces()}
        </div>
    )
}