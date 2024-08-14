const express = require('express');
const router = express.Router();
const knex = require('../db/conn');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const authenticateToken = require('./middleware/authenticateToken')
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

function authenticateToken(req, res, next) {
    const token = req.session.token;

    if (!token) return res.status(401).send('Acesso negado: Token não fornecido');

    jwt.verify(token, 'seuSegredoJWT', (err, user) => {
        if (err) return res.status(403).send('Acesso negado: Token inválido');
        req.user = user;
        next();
    });
}


function authorizeProfessional(req, res, next) {
    if (req.user.tipo !== 'profissional') {
        return res.status(403).send('Acesso negado');
    }
    next();
}

function authorizeClient(req, res, next) {
    const clientId = req.params.id; // ID do cliente da rota, por exemplo, /clientes/:id/dietas

    if (req.user.tipo !== 'cliente' || req.user.id != clientId) {
        return res.status(403).send('Acesso negado');
    }
    next();
}


router.get('/', authenticateToken, authorizeProfessional, (req, res) => {
    if (req.user.tipo === 'profissional') {
        // Renderiza a visão para profissionais
        res.render('./boardMain/index', { title: 'Personal Nutri - Profissional' });
    } else if (req.user.tipo === 'cliente') {
        // Renderiza a visão para clientes
        res.render('./boardMain/index', { title: 'Personal Nutri - Cliente' });
    } else {
        return res.status(403).send('Acesso negado');
    }
    // res.render('./boardMain/index', { title: 'Personal Nutri' })
})


// Criar Personal 
router.get('/create-personal', (req, res) => {
    res.render('./boardMain/createPersonal', { title: 'Criar Personal' })
})
router.post('/create-personal', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const user = "null";
    const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { name, email, email, password };


    // Insere os dados do personais no banco de dados
    knex('personais').insert({
        nome: name,
        email: email,
        user: user,
        cellphone: cellphone,
        password: password,
    })
        .then((personais) => {
            res.redirect('/admin/list-personal'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o personais:', error);
            res.status(500).send(`Erro ao inserir o personais: ${error.message}`);
        });

    console.log("x>", validate)

})
// Listagem dos Personais 
router.get('/list-personal', (req, res) => {
    // Função para listar todos os posts do banco de dados
    try {
        const personais = knex.select('*').from('personais');
        personais.then((personais) => {
            console.log('personais:', personais);
            res.render('./boardMain/listPersonal', { title: 'Listar Personal', personal: personais })
        })

    } catch (error) {
        console.error('Erro ao listar os posts:', error);
    }


})
// Editação dos Personais 
router.get('/edit-personal/:id', (req, res) => {
    var id = req.params.id;
    try {
        const personais = knex.select('*').from('personais').where({ id: id }).first();
        personais.then((personais) => {
            if (personais) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum post encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editPersonal', { title: 'Editar Personal', id: id, personais: personais })
        })
    } catch (error) {
        console.error('Erro ao selecionar o personais:', error);
    }
    console.log("id>", id)
})
router.post('/edit-personal/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const email = req.body.email;
    const user = "null";
    const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { nome, email, email, password, user, userId, cellphone, password };

    knex('personais').where({ id: id }).update(validate)
        .then(() => {
            console.log('Personal atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-personal/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o personal:', error);
            res.status(500).send('Erro ao atualizar o personal');
        });
})
// Deletar personal
router.post('/delete-personal', (req, res) => {
    var id = req.body.id

    knex('personais').where({ id: id }).del()
        .then(() => {
            console.log('Candidato deletado com sucesso!', id);
            res.redirect('/admin/list-personal');
        })
        .catch((error) => {
            console.error('Erro ao atualizar o candidato:', error);
            res.status(500).send('Erro ao atualizar o candidato');
        })

    console.log('XXX::: ', id)
})


//Criar alunos
router.get('/create-cliente', (req, res) => {
    res.render('./boardMain/createCliente', { title: 'Cliente' })
})
router.post('/create-cliente', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const user = "null";
    const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { name, email, cellphone, password };

    // Insere os dados do personais no banco de dados
    knex('clientes').insert({
        nome: name,
        email: email,
        // user: user,
        cellphone: cellphone,
        password: password,
    })
        .then((clientes) => {
            res.redirect('/admin/list-clientes'); // Move a chamada para dentro deste callback
            console.log('Cliente: ', clientes)
        })
        .catch((error) => {
            console.error('Erro ao inserir o cliente:', error);
            res.status(500).send(`Erro ao inserir o cliente: ${error.message}`);
        });

    console.log("RTN >>", validate)

})
//Listagem dos alunos
router.get('/list-clientes', authenticateToken, authorizeProfessional, (req, res) => {
    // Função para listar todos os alunos do banco de dados
    try {
        const alunos = knex.select('*').from('clientes');
        alunos.then((alunos) => {
            console.log('alunos:', alunos);
            res.render('./boardMain/listClientes', { title: 'Listar Aluno', aluno: alunos })
        })

    } catch (error) {
        console.error('Erro ao listar os posts:', error);
    }

})
// Editação dos alunos 
router.get('/edit-cliente/:id', (req, res) => {
    var id = req.params.id;

    try {
        // Fazendo a consulta ao banco de dados
        const clientes = knex('clientes')
            .where('clientes.id', id)
            .join('dietas', 'clientes.id', '=', 'dietas.clienteId')
            .select('clientes.*', 'dietas.*');

        // Espera a Promise ser resolvida antes de continuar
        clientes.then(clienteComDieta => {
            if (clienteComDieta.length > 0) {
                console.log('Cliente e dieta encontrados:', clienteComDieta);
                // Renderizando a página com os dados do cliente e da dieta
                res.render('./boardMain/editCliente', { title: 'Editar Aluno', id: id, cliente: clienteComDieta[0] });
            } else {
                console.log('Nenhum cliente encontrado com o ID fornecido.');
                res.render('./boardMain/editCliente', { title: 'Editar Aluno', id: id, cliente: null });
            }
        }).catch(error => {
            // Lidando com erros na consulta
            console.error('Erro ao selecionar o aluno:', error);
            res.status(500).send('Erro ao buscar dados do cliente');
        });

    } catch (error) {
        console.error('Erro ao selecionar o aluno:', error);
        res.status(500).send('Erro no servidor');
    }

    console.log("RTN >>", id);

})
router.post('/edit-cliente/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const email = req.body.email;
    // const user = "null";
    // const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { nome, email, password, cellphone, password };

    knex('clientes').where({ id: id }).update(validate)
        .then(() => {
            console.log('Aluno atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-aluno/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o aluno:', error);
            res.status(500).send('Erro ao atualizar o aluno');
        });
})
// Deletar aluno
router.post('/delete-cliente', (req, res) => {
    var id = req.body.id

    knex('clientes').where({ id: id }).del()
        .then(() => {
            console.log('Aluno deletado com sucesso!', id);
            res.redirect('/admin/list-clientes');
        })
        .catch((error) => {
            console.error('Erro ao deletar o aluno:', error);
            res.status(500).send('Erro ao deletar o aluno');
        })

    console.log('RTN >> ', id)
})



// Criar Nutricionista 
router.get('/create-nutri', (req, res) => {
    res.render('./boardNutri/createNutri', { title: 'Criar NUTRI' })
})
router.post('/create-nutri', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const user = "null";
    const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { name, email, email, password };


    // Insere os dados do personais no banco de dados
    knex('nutricionistas').insert({
        nome: name,
        email: email,
        user: user,
        cellphone: cellphone,
        password: password,
    })
        .then((personais) => {
            res.redirect('/admin/list-nutri'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o personais:', error);
            res.status(500).send(`Erro ao inserir o personais: ${error.message}`);
        });

    console.log("x>", validate)

})
// Listagem dos Nutricionistas 
router.get('/list-nutri', (req, res) => {
    // Função para listar todos os posts do banco de dados
    try {
        const nutricionista = knex.select('*').from('nutricionistas');
        nutricionista.then((nutricionistas) => {
            console.log('personais:', nutricionistas);
            res.render('./boardNutri/listNutri', { title: 'Listar Personal', nutricionista: nutricionistas })
        })

    } catch (error) {
        console.error('Erro ao listar os posts:', error);
    }


})
// Edição dos Nutricionistas 
router.get('/edit-nutri/:id', (req, res) => {
    var id = req.params.id;
    try {
        const nutricionistas = knex.select('*').from('nutricionistas').where({ id: id }).first();
        nutricionistas.then((nutricionistas) => {
            if (nutricionistas) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum post encontrado com o ID fornecido.');
            }
            res.render('./boardNutri/editNutri', { title: 'Editar Personal', id: id, nutricionistas: nutricionistas })
        })
    } catch (error) {
        console.error('Erro ao selecionar o personais:', error);
    }
    console.log("id>", id)
})
router.post('/edit-nutri/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const email = req.body.email;
    const user = "null";
    const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { nome, email, email, password, user, userId, cellphone, password };

    knex('nutricionistas').where({ id: id }).update(validate)
        .then(() => {
            console.log('Nutri atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-nutri/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o personal:', error);
            res.status(500).send('Erro ao atualizar o personal');
        });
})
// Deletar nutricionista
router.post('/delete-nutri', (req, res) => {
    var id = req.body.id

    knex('nutricionistas').where({ id: id }).del()
        .then(() => {
            console.log('Nutri deletado com sucesso!', id);
            res.redirect('/admin/list-nutri');
        })
        .catch((error) => {
            console.error('Erro ao atualizar o candidato:', error);
            res.status(500).send('Erro ao atualizar o candidato');
        })

    console.log('XXX::: ', id)
})



// Criar Paciente
router.get('/create-paciente', (req, res) => {
    res.render('./boardMain/createPaciente', { title: 'Paciente' })
})
router.post('/create-paciente', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    // const user = "null";
    // const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { name, email, cellphone, password };


    // Insere os dados do paciente no banco de dados
    knex('pacientes').insert({
        nome: name,
        email: email,
        // user: user,
        cellphone: cellphone,
        password: password,
    })
        .then((paciente) => {
            res.redirect('/admin/list-paciente'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o paciente:', error);
            res.status(500).send(`Erro ao inserir o paciente: ${error.message}`);
        });

    console.log("RTN >> ", validate)

})
// Listagem dos Pacientes 
router.get('/list-paciente', (req, res) => {
    // Função para listar todos os dados do banco de dados
    try {
        const paciente = knex.select('*').from('pacientes');
        paciente.then((pacientes) => {
            console.log('pacientes:', pacientes);
            res.render('./boardMain/listPaciente', { title: 'Paciente', paciente: pacientes })
        })

    } catch (error) {
        console.error('Erro ao listar os posts:', error);
    }
})
// Edição dos Pacientes 
router.get('/edit-paciente/:id', (req, res) => {
    var id = req.params.id;
    try {
        const paciente = knex.select('*').from('pacientes').where({ id: id }).first();
        paciente.then((pacientes) => {
            if (pacientes) {
                // console.log('paciente encontrado:', pacientes);
            } else {
                console.log('Nenhum paciente encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editPaciente', { title: 'Editar Paciente', id: id, pacientes: pacientes })
        })
    } catch (error) {
        console.error('Erro ao selecionar o alimento:', error);
    }
})
router.post('/edit-paciente/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const email = req.body.email;
    // const user = "null";
    // const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;

    const validate = { nome, email, password, cellphone, password };

    knex('pacientes').where({ id: id }).update(validate)
        .then(() => {
            console.log('Paciente atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-paciente/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o paciente:', error);
            res.status(500).send('Erro ao atualizar o paciente');
        });
})
// Deletar paciente 
router.post('/delete-paciente', (req, res) => {
    var id = req.body.id

    knex('pacientes').where({ id: id }).del()
        .then(() => {
            console.log('Paciente deletado com sucesso!', id);
            res.redirect('/admin/list-paciente');
        })
        .catch((error) => {
            console.error('Erro ao deletar o paciente:', error);
            res.status(500).send('Erro ao deletar o paciente');
        })

    console.log('DELETED::: ', id)
})



// Cria alimento 
router.get('/create-alimento', (req, res) => {
    res.render('./boardMain/createAlimento', { title: 'Criar Alimento' })
})
router.post('/create-alimento', (req, res) => {

    const name = req.body.name;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const carboidratos = req.body.carboidratos // nutrientes que se destacam por fornecer energia para o corpo;
    const lipidios = req.body.lipidios// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteinas = req.body.proteinas//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const vitaminas = req.body.vitaminas//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
    const saisMinerais = req.body.saisMinerais//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
    const alimentoId = req.body.alimentoId;


    // Insere os dados do personais no banco de dados
    knex('alimentos').insert({
        nome: name,
        quantidade: quantidade,
        categoria: categoria,
        carboidratos: carboidratos, // nutrientes que se destacam por fornecer energia para o corpo;
        lipidios: lipidios,// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
        proteinas: proteinas,//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
        vitaminas: vitaminas,//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
        saisMinerais: saisMinerais,//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
        alimentoId: alimentoId,
    })
        .then((alimento) => {
            res.redirect('/admin/list-alimentos'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o alimento:', error);
            res.status(500).send(`Erro ao inserir o alimento: ${error.message}`);
        });



})
// Listagem dos Alimentos
router.get('/list-alimentos', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const alimentos = knex.select('*').from('alimentos');
        alimentos.then((alimentos) => {
            console.log('alimentos:', alimentos);
            res.render('./boardMain/listAlimentos', { title: 'Listar Alimento', alimento: alimentos })
        })

    } catch (error) {
        console.error('Erro ao listar os alimentos:', error);
    }

})
// Edição dos Alimentos 
router.get('/edit-alimento/:id', (req, res) => {
    var id = req.params.id;
    try {
        const alimentos = knex.select('*').from('alimentos').where({ id: id }).first();
        alimentos.then((alimentos) => {
            if (alimentos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum post encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editAlimento', { title: 'Editar Alimento', id: id, alimentos: alimentos })
        })
    } catch (error) {
        console.error('Erro ao selecionar o alimento:', error);
    }
})
router.post('/edit-alimento/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const carboidratos = req.body.carboidratos // nutrientes que se destacam por fornecer energia para o corpo;
    const lipidios = req.body.lipidios// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteinas = req.body.proteinas//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const vitaminas = req.body.vitaminas//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
    const saisMinerais = req.body.saisMinerais//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
    const alimentoId = req.body.alimentoId;

    const validate = {
        nome, quantidade, categoria, carboidratos, lipidios,
        proteinas, vitaminas, saisMinerais, alimentoId
    };

    knex('alimentos').where({ id: id }).update(validate)
        .then(() => {
            console.log('Alimento atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-alimento/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o alimento:', error);
            res.status(500).send('Erro ao atualizar o alimento');
        });
})
// Deletar alimento 
router.post('/delete-alimento', (req, res) => {
    var id = req.body.id

    knex('alimentos').where({ id: id }).del()
        .then(() => {
            console.log('Alimento deletado com sucesso!', id);
            res.redirect('/admin/list-alimentos');
        })
        .catch((error) => {
            console.error('Erro ao deletar o alimento:', error);
            res.status(500).send('Erro ao deletar o alimento');
        })

    console.log('DELETED::: ', id)
})


// Criar Suplemento 
router.get('/create-suplemento', (req, res) => {
    res.render('./boardMain/createSuplemento', { title: 'Criar Suplemento' })
})
router.post('/create-suplemento', (req, res) => {

    const name = req.body.name;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const carboidratos = req.body.carboidratos // nutrientes que se destacam por fornecer energia para o corpo;
    const lipidios = req.body.lipidios// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteinas = req.body.proteinas//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const vitaminas = req.body.vitaminas//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
    const saisMinerais = req.body.saisMinerais//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
    const suplementoId = req.body.suplementoId;


    // Insere os dados do personais no banco de dados
    knex('suplementos').insert({
        nome: name,
        quantidade: quantidade,
        categoria: categoria,
        carboidratos: carboidratos, // nutrientes que se destacam por fornecer energia para o corpo;
        lipidios: lipidios,// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
        proteinas: proteinas,//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
        vitaminas: vitaminas,//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
        saisMinerais: saisMinerais,//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
        suplementoId: suplementoId,
    })
        .then((suplemento) => {
            res.redirect('/admin/list-suplementos'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o suplemento:', error);
            res.status(500).send(`Erro ao inserir o suplemento: ${error.message}`);
        });
})
// Listar suplemento
router.get('/list-suplementos', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const suplementos = knex.select('*').from('suplementos');
        suplementos.then((suplementos) => {
            console.log('alimentos:', suplementos);
            res.render('./boardMain/listSuplementos', { title: 'Listar Alimento', suplemento: suplementos })
        })

    } catch (error) {
        console.error('Erro ao listar os suplementos:', error);
    }

})
// Editar suplemento
router.get('/edit-suplemento/:id', (req, res) => {
    var id = req.params.id;
    try {
        const suplementos = knex.select('*').from('suplementos').where({ id: id }).first();
        suplementos.then((suplementos) => {
            if (suplementos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum suplemento encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editSuplemento', { title: 'Editar Suplemento', id: id, suplementos: suplementos })
        })
    } catch (error) {
        console.error('Erro ao selecionar o suplemento:', error);
    }
})
router.post('/edit-suplemento/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const carboidratos = req.body.carboidratos // nutrientes que se destacam por fornecer energia para o corpo;
    const lipidios = req.body.lipidios// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteinas = req.body.proteinas//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const vitaminas = req.body.vitaminas//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
    const saisMinerais = req.body.saisMinerais//: nutrientes que atuam nas mais variadas funções do organismo, como a constituição de ossos e dentes, regulação de líquidos corporais e composição de hormônios."
    const suplementoId = req.body.suplementoId;

    const validate = {
        nome, quantidade, categoria, carboidratos, lipidios,
        proteinas, vitaminas, saisMinerais, suplementoId
    };

    knex('suplementos').where({ id: id }).update(validate)
        .then(() => {
            console.log('Suplemento atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-suplemento/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o suplemento:', error);
            res.status(500).send('Erro ao atualizar o suplemento');
        });
})
// Deletar suplemento
router.post('/delete-suplemento', (req, res) => {
    var id = req.body.id

    knex('suplementos').where({ id: id }).del()
        .then(() => {
            console.log('Suplemento deletado com sucesso!', id);
            res.redirect('/admin/list-suplementos');
        })
        .catch((error) => {
            console.error('Erro ao deletar o suplemento:', error);
            res.status(500).send('Erro ao deletar o suplemento');
        })

    console.log('DELETED::: ', id)
})


// Criar Ergogênico
router.get('/create-ergogenico', (req, res) => {
    res.render('./boardMain/createErgogenico', { title: 'Criar Ergogenico' })
})
router.post('/create-ergogenico', (req, res) => {

    const nome = req.body.nome;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const ergogenicoId = req.body.ergogenicoId;


    // Insere os dados do personais no banco de dados
    knex('ergogenicos').insert({
        nome: nome,
        quantidade: quantidade,
        categoria: categoria,
        ergogenicoId: ergogenicoId,
    })
        .then((ergogenico) => {
            res.redirect('/admin/list-ergogenico'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o ergogenico:', error);
            res.status(500).send(`Erro ao inserir o ergogenico: ${error.message}`);
        });



})
// Listar ergogênico
router.get('/list-ergogenico', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const ergogenicos = knex.select('*').from('ergogenicos');
        ergogenicos.then((ergogenicos) => {
            console.log('ergogenicos:', ergogenicos);
            res.render('./boardMain/listErgogenicos', { title: 'Listar Ergogenicos', ergogenico: ergogenicos })
        })

    } catch (error) {
        console.error('Erro ao listar os ergogenicos:', error);
    }

})
// Editar ergogênico
router.get('/edit-ergogenico/:id', (req, res) => {
    var id = req.params.id;
    try {
        const ergogenicos = knex.select('*').from('ergogenicos').where({ id: id }).first();
        ergogenicos.then((ergogenicos) => {
            if (ergogenicos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum ergogenico encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editErgogenico', { title: 'Editar Ergogenico', id: id, ergogenicos: ergogenicos })
        })
    } catch (error) {
        console.error('Erro ao selecionar o suplemento:', error);
    }
})
router.post('/edit-ergogenico/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const quantidade = req.body.quantidade;
    const categoria = req.body.categoria;
    const ergogenicoId = req.body.ergogenicoId;

    const validate = { nome, quantidade, categoria, ergogenicoId };

    knex('ergogenicos').where({ id: id }).update(validate)
        .then(() => {
            console.log('Ergogenico atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-ergogenico/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o ergogenico:', error);
            res.status(500).send('Erro ao atualizar o ergogenico');
        });
})
// Deletar ergogênico
router.post('/delete-ergogenico', (req, res) => {
    var id = req.body.id

    knex('ergogenicos').where({ id: id }).del()
        .then(() => {
            console.log('Ergogenico deletado com sucesso!', id);
            res.redirect('/admin/list-ergogenico');
        })
        .catch((error) => {
            console.error('Erro ao deletar o ergogenico:', error);
            res.status(500).send('Erro ao deletar o ergogenico');
        })

    console.log('DELETED::: ', id)
})


// Criar Protocolo
router.get('/create-protocolo', (req, res) => {
    res.render('./boardMain/createProtocolo', { title: 'Criar Protocolo' })
})


// Criar Exercicio
router.get('/create-exercicio', (req, res) => {
    res.render('./boardMain/createExercicio', { title: 'Criar Eexercicio' })
})
router.post('/create-exercicio', (req, res) => {
    const nome_do_exercicio = req.body.nome_do_exercicio;
    const descricao = req.body.descricao;
    const grupamento_muscular = req.body.grupamento_muscular;
    const series = req.body.series;
    const repeticoes_por_serie = req.body.repeticoes_por_serie;
    const carga_por_lado = req.body.carga_por_lado
    const unidade_de_medida_carga = req.body.unidade_de_medida_carga;
    const equipamento_necessario = req.body.equipamento_necessario;
    const tempo_de_descanso = req.body.tempo_de_descanso;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const exercicioId = req.body.exercicioId;
    // Insere os dados do personais no banco de dados

    knex('exercicios').insert({
        nome_do_exercicio: nome_do_exercicio,
        descricao: descricao,
        grupamento_muscular: grupamento_muscular,
        series: series,
        repeticoes_por_serie: repeticoes_por_serie,
        carga_por_lado: carga_por_lado,
        unidade_de_medida_carga: unidade_de_medida_carga,
        equipamento_necessario: equipamento_necessario,
        tempo_de_descanso: tempo_de_descanso,
        nivel_de_dificuldade: nivel_de_dificuldade,
        exercicioId: exercicioId,
    })
        .then((exercicio) => {
            res.redirect('/admin/list-exercicios'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o exercicio:', error);
            res.status(500).send(`Erro ao inserir o exercicio: ${error.message}`);
        });
})
// Listar exercicio
router.get('/list-exercicios', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const exercicios = knex.select('*').from('exercicios');
        exercicios.then((exercicios) => {
            console.log('exercicios:', exercicios);
            res.render('./boardMain/listExercicios', { title: 'Listar Exercicios', exercicio: exercicios })
        })

    } catch (error) {
        console.error('Erro ao listar os exercicios', error);
    }

})
// Editar exercicio
router.get('/edit-exercicio/:id', (req, res) => {
    var id = req.params.id;
    try {
        const exercicios = knex.select('*').from('exercicios').where({ id: id }).first();
        exercicios.then((exercicios) => {
            if (exercicios) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum exercicio encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editExercicio', { title: 'Editar Exercicio', id: id, exercicios: exercicios })
        })
    } catch (error) {
        console.error('Erro ao selecionar o exercicio:', error);
    }
})
router.post('/edit-exercicio/:id', (req, res) => {
    const id = req.params.id;
    const nome_do_exercicio = req.body.nome_do_exercicio;
    const descricao = req.body.descricao;
    const grupamento_muscular = req.body.grupamento_muscular;
    const series = req.body.series;
    const repeticoes_por_serie = req.body.repeticoes_por_serie;
    const carga_por_lado = req.body.carga_por_lado
    const unidade_de_medida_carga = req.body.unidade_de_medida_carga;
    const equipamento_necessario = req.body.equipamento_necessario;
    const tempo_de_descanso = req.body.tempo_de_descanso;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const exercicioId = req.body.exercicioId;
    // Insere os dados do personais no banco de dadosc

    const validate = {
        nome_do_exercicio, descricao, grupamento_muscular, series,
        repeticoes_por_serie, carga_por_lado, unidade_de_medida_carga,
        equipamento_necessario, tempo_de_descanso, nivel_de_dificuldade, exercicioId
    };

    knex('exercicios').where({ id: id }).update(validate)
        .then(() => {
            console.log('Exercicio atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-exercicio/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o ergogenico:', error);
            res.status(500).send('Erro ao atualizar o ergogenico');
        });
})
// Deletar exercicio
router.post('/delete-exercicio', (req, res) => {
    var id = req.body.id

    knex('exercicios').where({ id: id }).del()
        .then(() => {
            console.log('Exercicio deletado com sucesso!', id);
            res.redirect('/admin/list-exercicios');
        })
        .catch((error) => {
            console.error('Erro ao deletar o exercicio:', error);
            res.status(500).send('Erro ao deletar o exercicio');
        })

    console.log('DELETED::: ', id)
})


// Criar grupamento muscular
router.get('/create-gpmuscular', (req, res) => {
    res.render('./boardMain/createGPmuscular', { title: 'Criar GP' })
})
router.post('/create-gpmuscular', (req, res) => {
    const gpmuscular_nome = req.body.gpmuscular_nome;
    const gpmuscularId = req.body.gpmuscularId;
    // Insere os dados do personais no banco de dados

    knex('gpmuscular').insert({
        gpmuscular_nome: gpmuscular_nome,
        gpmuscularId: gpmuscularId,
    })
        .then((gpmuscular) => {
            res.redirect('/admin/list-gpmuscular'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o gpmuscular:', error);
            res.status(500).send(`Erro ao inserir o gpmuscular: ${error.message}`);
        });
})
// Listar grupamento muscular
router.get('/list-gpmuscular', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const gpmusculares = knex.select('*').from('gpmuscular');
        gpmusculares.then((gpmusculares) => {
            console.log('exercicios:', gpmusculares);
            res.render('./boardMain/listGPmuscular', { title: 'Listar Exercicios', gpmuscular: gpmusculares })
        })

    } catch (error) {
        console.error('Erro ao listar os gpmusculares', error);
    }

})
// Editar grupamento muscular
router.get('/edit-gpmuscular/:id', (req, res) => {
    var id = req.params.id;
    try {
        const gpmuscular = knex.select('*').from('gpmuscular').where({ id: id }).first();
        gpmuscular.then((gpmuscular) => {
            if (gpmuscular) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum gpmuscular encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editGPmuscular', { title: 'Editar GP muscular', id: id, gpmuscular: gpmuscular })
        })
    } catch (error) {
        console.error('Erro ao selecionar o exercicio:', error);
    }
})
router.post('/edit-gpmuscular/:id', (req, res) => {
    const id = req.params.id;
    const gpmuscular_nome = req.body.gpmuscular_nome;
    const gpmuscularId = req.body.gpmuscularId;
    // Insere os dados do personais no banco de dados
    // Insere os dados do personais no banco de dadosc

    const validate = { gpmuscularId, gpmuscular_nome };

    knex('gpmuscular').where({ id: id }).update(validate)
        .then(() => {
            console.log('GPmuscular atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-gpmuscular/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o gpmuscular:', error);
            res.status(500).send('Erro ao atualizar o gpmuscular');
        });
})
// Deletar grupamento muscular
router.post('/delete-gpmuscular', (req, res) => {
    var id = req.body.id

    knex('gpmuscular').where({ id: id }).del()
        .then(() => {
            console.log('Gpmuscular deletado com sucesso!', id);
            res.redirect('/admin/list-gpmuscular');
        })
        .catch((error) => {
            console.error('Erro ao deletar o gpmuscular:', error);
            res.status(500).send('Erro ao deletar o gpmuscular');
        })

    console.log('DELETED::: ', id)
})


// Criar Treino 
router.get('/create-treino', (req, res) => {
    res.render('./boardMain/createTreino', { title: 'Criar Treino' })
})
router.post('/create-treino', (req, res) => {
    const nome_do_treino = req.body.nome_do_treino;
    const descricao_do_treino = req.body.descricao_do_treino;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const objetivo_do_treino = req.body.objetivo_do_treino;
    const duracao_estimada_do_treino = req.body.duracao_estimada_do_treino;
    const frequencia_semanal = req.body.frequencia_semanal;
    const treinoId = req.body.treinoId;
    // Insere os dados do personais no banco de dados

    knex('treinos').insert({
        nome_do_treino: nome_do_treino,
        descricao_do_treino: descricao_do_treino,
        nivel_de_dificuldade: nivel_de_dificuldade,
        objetivo_do_treino: objetivo_do_treino,
        duracao_estimada_do_treino: duracao_estimada_do_treino,
        frequencia_semanal: frequencia_semanal,
        treinoId: treinoId
    })
        .then((treinos) => {
            res.redirect('/admin/list-treinos'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o treino:', error);
            res.status(500).send(`Erro ao inserir o treino: ${error.message}`);
        });
})
// Listar treino
router.get('/list-treinos', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const treinos = knex.select('*').from('treinos');
        treinos.then((treinos) => {
            console.log('exercicios:', treinos);
            res.render('./boardMain/listTreinos', { title: 'Listar Exercicios', treino: treinos })
        })

    } catch (error) {
        console.error('Erro ao listar os gpmusculares', error);
    }

})
// Editar treino
router.get('/edit-treino/:id', (req, res) => {
    var id = req.params.id;
    try {
        const treinos = knex.select('*').from('treinos').where({ id: id }).first();
        treinos.then((treinos) => {
            if (treinos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum treinos encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editTreino', { title: 'Editar Treino', id: id, treino: treinos })
        })
    } catch (error) {
        console.error('Erro ao selecionar o exercicio:', error);
    }
})
router.post('/edit-treino/:id', (req, res) => {
    const id = req.params.id;
    const nome_do_treino = req.body.nome_do_treino;
    const descricao_do_treino = req.body.descricao_do_treino;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const objetivo_do_treino = req.body.objetivo_do_treino;
    const duracao_estimada_do_treino = req.body.duracao_estimada_do_treino;
    const frequencia_semanal = req.body.frequencia_semanal;
    const treinoId = req.body.treinoId;

    const validate = {
        nome_do_treino, descricao_do_treino, nivel_de_dificuldade,
        objetivo_do_treino, duracao_estimada_do_treino, frequencia_semanal, treinoId
    };

    knex('treinos').where({ id: id }).update(validate)
        .then(() => {
            console.log('Treino atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-treino/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o treino:', error);
            res.status(500).send('Erro ao atualizar o treino');
        });
})
// Deletar treino
router.post('/delete-treino', (req, res) => {
    var id = req.body.id

    knex('treinos').where({ id: id }).del()
        .then(() => {
            console.log('Treino deletado com sucesso!', id);
            res.redirect('/admin/list-treinos');
        })
        .catch((error) => {
            console.error('Erro ao deletar o treino:', error);
            res.status(500).send('Erro ao deletar o treino');
        })

    console.log('DELETED::: ', id)
})


router.post('/criar-dieta', async (req, res) => {
    const {
        nome_da_dieta,
        descricao_da_dieta,
        objetivo_da_dieta,
        duracao_estimada,
        nivel_de_dificuldade,
        calorias_diarias,
        proteinas,
        carboidratos,
        gorduras,
        alimentos
    } = req.body;

    try {
        // Inserindo a dieta
        const [dieta_id] = await knex('dietas').insert({
            nome_da_dieta,
            descricao_da_dieta,
            objetivo_da_dieta,
            duracao_estimada,
            nivel_de_dificuldade,
            calorias_diarias,
            proteinas,
            carboidratos,
            gorduras,
            clienteId: 7,
            alimentoId: 11,
            // suplementoId: 3,
            // ergogenicoId: 1 // Assumindo que você tem autenticação e o ID do usuário logado está disponível
        });

        // Inserindo os alimentos na dieta
        // for (const alimento_id of alimentos) {
        //     await knex('dietas').insert({
        //         dieta_id,
        //         alimento_id
        //     });
        // }

        res.redirect(`/admin/list-dietas`); // Redirecionar para o perfil do cliente ou outro caminho desejado
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao criar dieta');
    }
});
router.get('/alimentos', async (req, res) => {
    try {
        const alimentos = await knex('alimentos').select('id', 'nome');
        res.json(alimentos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar alimentos');
    }
});


// Criar Dieta 
router.get('/create-dieta', (req, res) => {
    res.render('./boardMain/createDieta', { title: 'Criar Dieta' })
})
router.post('/create-dieta', (req, res) => {
    const nome_da_dieta = req.body.nome_da_dieta;
    const descricao_da_dieta = req.body.descricao_da_dieta;
    const objetivo_da_dieta = req.body.objetivo_da_dieta;
    const duracao_estimada = req.body.duracao_estimada;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const calorias_diarias = req.body.calorias_diarias;
    const proteinas = req.body.proteinas;
    const carboidratos = req.body.carboidratos;
    const gorduras = req.body.gorduras;
    // Insere os dados do personais no banco de dados

    knex('dietas').insert({
        nome_da_dieta: nome_da_dieta,
        descricao_da_dieta: descricao_da_dieta,
        objetivo_da_dieta: objetivo_da_dieta,
        duracao_estimada: duracao_estimada,
        nivel_de_dificuldade: nivel_de_dificuldade,
        calorias_diarias: calorias_diarias,
        proteinas: proteinas,
        carboidratos: carboidratos,
        gorduras: gorduras
    })
        .then((dietas) => {
            res.redirect('/admin/list-dietas'); // Move a chamada para dentro deste callback
        })
        .catch((error) => {
            console.error('Erro ao inserir o treino:', error);
            res.status(500).send(`Erro ao inserir o treino: ${error.message}`);
        });
})
// Listar Dieta 
router.get('/list-dietas', (req, res) => {
    // Função para listar todos os alimentos do banco de dados
    try {
        const alimentosEDietas = knex('alimentos')
            .distinct().table('alimentos').innerJoin('dietas', 'alimentos.dietaId', 'dietas.id');

        alimentosEDietas.then((resultados) => {
            console.log('alimentos e dietas:', resultados);
            res.render('./boardMain/listDietas', { title: 'Listar Dietas', dieta: resultados });
        }).catch((error) => {
            console.error('Erro ao listar os alimentos e dietas', error);
            res.status(500).send('Erro ao listar os alimentos e dietas');
        });

    } catch (error) {
        console.error('Erro ao listar os alimentos e dietas', error);
        res.status(500).send('Erro ao listar os alimentos e dietas');
    }


})
// Editar Dieta 
router.get('/edit-dieta/:id', (req, res) => {
    var id = req.params.id;
    try {
        const dietas = knex('dietas')
            .where('dietas.id', id)
            .join('alimentos', 'dietas.id', '=', 'alimentos.dietaId')
            .select('dietas.*', 'alimentos.*')
        dietas.then((dietaComAlimentos) => {
            if (dietaComAlimentos) {
                console.log('dietas&Alimentos:', dietaComAlimentos);
            } else {
                console.log('Nenhuma dieta encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editDieta', { title: 'Editar Dieta', id: id, dieta: dietaComAlimentos[0] })
        })
    } catch (error) {
        console.error('Erro ao selecionar o exercicio:', error);
    }
})
router.post('/edit-dieta/:id', (req, res) => {
    const id = req.params.id;
    const nome_da_dieta = req.body.nome_da_dieta;
    const descricao_da_dieta = req.body.descricao_da_dieta;
    const objetivo_da_dieta = req.body.objetivo_da_dieta;
    const duracao_estimada = req.body.duracao_estimada;
    const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
    const calorias_diarias = req.body.calorias_diarias;
    const proteinas = req.body.proteinas;
    const carboidratos = req.body.carboidratos;
    const gorduras = req.body.gorduras;

    const validate = {
        nome_da_dieta, descricao_da_dieta, objetivo_da_dieta, duracao_estimada,
        nivel_de_dificuldade, calorias_diarias, proteinas, carboidratos, gorduras
    };

    knex('dietas').where({ id: id }).update(validate)
        .then(() => {
            console.log('Dieta atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-dieta/${id}`);
        })
        .catch((error) => {
            console.error('Erro ao atualizar o dieta:', error);
            res.status(500).send('Erro ao atualizar o dieta');
        });
})
// Deletar Dieta 
router.post('/delete-dieta', (req, res) => {
    var id = req.body.id

    knex('dietas').where({ id: id }).del()
        .then(() => {
            console.log('Dieta deletado com sucesso!', id);
            res.redirect('/admin/list-dietas');
        })
        .catch((error) => {
            console.error('Erro ao deletar o dieta:', error);
            res.status(500).send('Erro ao deletar o dieta');
        })

    console.log('DELETED::: ', id)
})

//Register
router.get('/register', (req, res, next) => {
    res.render('./boardMain/register', {
        title: 'Registrar Profissional'
    })
})
router.post('/register', async (req, res) => {
    const { nome, email, senha, tipo } = req.body; // tipo: 'profissional' ou 'cliente'

    try {
        const hashedPassword = await bcrypt.hash(senha, 10);

        knex('usuarios').insert({
            nome,
            email,
            senha: hashedPassword,
            tipo: tipo
        })
            .then((rtn) => {
                console.log(rtn)
                res.redirect('/admin/login')
            })

        // res.status(201).send('Usuário registrado com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao registrar usuário');
    }
});

//Login
router.get('/login', (req, res, next) => {
    res.render('./boardMain/login', {
        title: 'Logar Profissional'
    })
})
router.post('/login', async (req, res) => {
    const { email, senha, tipo } = req.body;

    try {
        const user = await knex('usuarios').where({ email }).first();

        if (user && await bcrypt.compare(senha, user.senha)) {
            // Suponha que você já autenticou o usuário e gerou um token JWT
            const token = jwt.sign({ id: user.id, tipo: user.tipo }, 'seuSegredoJWT', { expiresIn: '1h' });

            // Salva o token na sessão do usuário
            req.session.token = token;
            console.log({token})

            res.redirect('/admin'); // Redireciona para a página inicial ou outra rota
        } else {
            res.status(401).send('Credenciais inválidas');
        }
    } catch (error) {
        res.status(500).send('Erro ao realizar login');
    }
});

router.get('/forgotpass', (req, res, next) => {
    res.render('./boardMain/forgotPass', {
        title: 'Recuperar senha'
    })
})

//Criar protocolo

module.exports = router;