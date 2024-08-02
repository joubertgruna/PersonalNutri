const express = require('express');
const router = express.Router();
const knex = require('../db/conn');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

router.get('/',(req, res) => {
    res.render('./boardMain/index', {title: 'Personal Nutri'})
})

/** Basicamente o personal terá a possibilidade de agrupar os exercícios em treinos 
 *  personalizados para seus alunos, esses exercícios serão puxados da base de treino global 
 *  que é alimentada pelo dono da plataforma, porem eu preciso dar uma flexibilidade para que o
 *  personal crie, edite e delete exercícios específicos para à necessidade do aluno dele, porém esses 
 *  exercícios que ele criar por conta própria não podem se misturar a base de dados de exercícios global 
 *  alimentada pelo super usuário. 
*/

module.exports = router;