const express = require('express');
const router = express.Router();
const knex = require('../db/conn');

router.get('/',(req, res) => {
    res.render('./boardMain/index', {title: 'Personal Nutri'})
})

/** Basicamente o nutricionista terá a possibilidade de agrupar os alimentos em dietas 
 *  personalizados para seus pascientes, esses alimentos serão puxados da base de alimentos global 
 *  que é alimentada pelo dono da plataforma, porem eu preciso dar uma flexibilidade para que o
 *  nutricionista crie, edite e delete alimentos específicos para à necessidade do pasciente dele, porém esses 
 *  alimentos que ele criar por conta própria não podem se misturar a base de dados de alimentos global 
 *  alimentada pelo super usuário. 
*/

module.exports = router;