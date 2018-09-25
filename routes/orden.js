var express = require('express');
var router = express.Router();
var login = require('./login').router
var { getSecret } = require('./login')
var { requestWS } = require('./webservice')
var { pool, url } = require('../util/DB.js');

/**
 * Ruta que retorna la orden de un id dado
 */
router.get('/proceso/', login.validarSesion, async function (req, res, next) {
    try {
        var grupo = req.session_itsc.ad_client_id;
        var org = req.session_itsc.ad_org_id;
        var query = `
            select 
                vw.proceso as tipo_proceso,
                vw.producto,
                vw.lineadesc as linea,
                to_char(coalesce(vw.fechainicio, vw.fechalanzamiento), 'DD/MM/YYYY') as fecha_inicio,
                vw.porc_ejecucion_proceso as porcentaje_avance,
                vw.porc_atraso,
                vw.area,
                to_char(coalesce(vw.fechainiciotarea, vw.fechalanzamiento), 'DD/MM/YYYY') as fecha_inicio_tarea,
                vw.totalasig as horas_asignadas
            from vw_consultaprocesos vw
            where vw.ad_client_id = ${Number(grupo)}::integer
        `;

        console.log(query)

        var data = await pool.query(query);
        
        res.set('Cache-Control', 'private, max-age=8');
        res.json(parseDBdata(data));
    
    } catch (e) { next(e) }
})

function parseDBdata (data) {
    return {
        fields: data.fields.map(f => f.name),
        rows: data.rows
    }
}


module.exports = router;