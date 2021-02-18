import React, { useEffect, useState } from 'react';
import ReactAudioPlayer from 'react-audio-player';
import Card from '@material-ui/core/Card';
import { CardContent } from '@material-ui/core';

export default function Entrada(props) {
    //state
    const [voz, setVoz] = useState({})

    //onMount
    useEffect(() => {
        setVoz(props.voz)
    }, [])

    function renderEntrada() {
        if (Object.keys(voz).length) {
            let convertida = voz["estado"] === "Convertida"
            return (
                <Card>
                    <CardContent>
                        <b>Correo:</b> <a href={`mailto:voz.email`}>{voz.email}</a> <br></br>
                        <b>Nombres:</b> {voz.nombres} <br></br>
                        <b>Apellidos:</b> {voz.apellidos} <br></br>
                        <b>Fecha de Subida:</b> {voz.f_creacion.split("T")[0] + " | " + voz.f_creacion.split("T")[1]} <br></br>
                        <b>Estado de Voz:</b> {voz["estado"]} <br></br>
                        <b>Archivo Original:</b> <br></br>
                        <ReactAudioPlayer
                            src = {window.URL.createObjectURL(voz.original)}
                            controls
                        />
                        {convertida ? 
                        <div>
                            <br></br>
                            <b>Archivo Convertido:</b> <br></br>
                            <ReactAudioPlayer
                                src = {window.URL.createObjectURL(voz.convertida)}
                                controls
                            />
                        </div>
                        : ""}
                    </CardContent>
                </Card> 
            )
        }
        return ""
    }

    return renderEntrada()
}