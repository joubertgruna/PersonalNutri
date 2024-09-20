const express = require('express');
const router = express.Router();
const qs = require('qs'); // Importando o pacote qs
const knex = require('../db/conn');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const authenticateToken = require('./middleware/authenticateToken')
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

function authenticateToken(req, res, next) {
    const token = req.session.token;

    if (!token) return res.redirect('/admin/login')
        // res.status(401).redirect('/admin/login');
    jwt.verify(token, 'seuSegredoJWT', (err, user) => {
        if (err) return res.status(403).redirect('/admin/login');
        req.user = user;
        next();
    });
}
/**
 * Middleware para recuperar detalhes completos do usuário logado
 */
async function getUserDetails(req, res, next) {
    const userId = req.user.id; // ID do usuário autenticado

    try {
        // Consulta no banco de dados para pegar todas as informações do usuário
        const user = await knex('usuarios').where({ id: userId }).first();

        if (!user) {
            return res.status(404).send('Usuário não encontrado');
        }

        // Armazena as informações completas do usuário em req.userDetails
        req.userDetails = user;
        next();
    } catch (err) {
        console.error('Erro ao buscar informações do usuário: ', err);
        res.status(500).send('Erro interno do servidor');
    }
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


// Rota para carregar a página inicial de acordo com o tipo de usuário
router.get('/', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails; // Agora você pode acessar os detalhes completos do usuário

    if (user.tipo === 'profissional') {
        res.render('./boardMain/index', { 
            title: 'Personal Nutri - Profissional',
            user: user // Passa o usuário completo para a view
        });
        console.log('User: ', user);
    } else if (user.tipo === 'cliente') {
        res.render('./boardMain/index', { 
            title: 'Personal Nutri - Cliente',
            user: user // Passa o usuário completo para a view
        });
    } else {
        return res.status(403).send('Acesso negado');
    }
});


// Criar Personal 
router.get('/create-personal', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createPersonal', { user: user, title: 'Criar Personal' })
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
router.get('/list-personal', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    // Função para listar todos os posts do banco de dados
    try {
        const personais = knex.select('*').from('personais');
        personais.then((personais) => {
            console.log('personais:', personais);
            res.render('./boardMain/listPersonal', { user: user, title: 'Listar Personal', personal: personais })
        })

    } catch (error) {
        console.error('Erro ao listar os posts:', error);
    }


})
// Editação dos Personais 
router.get('/edit-personal/:id', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const personais = knex.select('*').from('personais').where({ id: id }).first();
        personais.then((personais) => {
            if (personais) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum post encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editPersonal', { user: user, title: 'Editar Personal', id: id, personais: personais })
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
router.get('/create-cliente', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails
    res.render('./boardMain/createCliente', { user: user, title: 'Cliente' })
})

router.post('/clientes', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails
    console.log('User: ', user)
    try {
        const { name, email, cellphone, password, peso, gordura, abdomen, braco, peitoral } = req.body;
        const profissionalId = req.user.id; // Assumindo que `req.user` contém o ID do profissional autenticado
        console.log('ID Profissional >>', profissionalId);

        // Insere o cliente na base de dados
        const [clienteId] = await knex('clientes').insert({
            nome: name,
            email: email,
            cellphone: cellphone,
            password: password,
            peso: peso,
            gordura: gordura,
            abdomen: abdomen,
            braco: braco,
            peitoral: peitoral,
            profissionalId: profissionalId
        });

        // Verifica se o cliente foi inserido corretamente
        if (clienteId) {
            console.log('Cliente inserido com ID:', clienteId);
            res.redirect('/admin/list-clientes');
        } else {
            throw new Error('Erro ao inserir cliente no banco de dados.');
        }
    } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        res.status(500).send('Erro ao adicionar cliente');
    }
});


router.post('/create-cliente', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const profissionalId = req.user.id;
    // const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;
    const peso = req.body.peso
    const gordura = req.body.gordura
    const abdomen = req.body.abdomen
    const braco = req.body.braco
    const peitoral = req.body.peitoral

    const validate = { name, email, cellphone, password, peso, gordura, abdomen, braco, peitoral, profissionalId };

    // Insere os dados do personais no banco de dados
    knex('clientes').insert({
        nome: name,
        email: email,
        cellphone: cellphone,
        password: password,
        peso: peso,
        gordura: gordura,
        abdomen: abdomen,
        braco: braco,
        peitoral: peitoral,
        profissionalId: profissionalId,

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
router.get('/list-clientes', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    const profissionalId = req.user.id;  // Obtém o ID do profissional da sessão autenticada

    try {
        // Consulta no banco de dados, filtrando os clientes pelo profissionalId
        const clientes = knex('clientes')
            .where('profissionalId', profissionalId)
            .select('*');

        // Processa a consulta e envia os dados para o template
        clientes.then((clientes) => {
            console.log('Clientes relacionados ao profissional:', clientes);
            res.render('./boardMain/listClientes', { user: user, title: 'Listar Clientes', cliente: clientes });
        });

    } catch (error) {
        console.error('Erro ao listar os clientes:', error);
        res.status(500).send('Erro ao listar os clientes');
    }
});
// Editação dos alunos 
router.get('/edit-cliente/:id', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    var id = req.params.id;

    try {
        // Consultar cliente
        const cliente = await knex('clientes')
            .where('id', id)
            .select('*')
            .first();

        if (!cliente) {
            console.log('Nenhum cliente encontrado com o ID fornecido.');
            return res.render('./boardMain/editCliente', { user: user, title: 'Editar Aluno', id: id, cliente: null, dieta: null });
        }

        // Consultar dieta
        const dieta = await knex('dietas')
            .where('clienteId', id)
            .select('*')
            .first();

        if (!dieta) {
            console.log('Nenhuma dieta encontrada para o cliente.');
            return res.render('./boardMain/editCliente', { user: user, title: 'Editar Aluno', id: id, cliente: cliente, dieta: null });
        }

        // Consultar refeições e alimentos
        const refeicoes = await knex('refeicoes')
            .where('dietaId', dieta.id)
            .select('*');

        // Adicionar alimentos para cada refeição
        const refeicoesComAlimentos = await Promise.all(refeicoes.map(async refeicao => {
            const alimentos = await knex('alimentos')
                .where('refeicaoId', refeicao.id)
                .select('*');
            return { ...refeicao, alimentos };
        }));

        console.log('Cliente encontrado:', cliente);
        console.log('Dieta vinculada:', dieta);
        console.log('Refeições com alimentos:', refeicoesComAlimentos);

        // Renderizar página com dados completos
        res.render('./boardMain/editCliente', {
            title: 'Editar Aluno',
            id: id,
            cliente: cliente,
            dieta: { ...dieta, refeicoes: refeicoesComAlimentos }, 
            user: user
        });

    } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
        res.status(500).send('Erro ao buscar dados do cliente');
    }
});




router.post('/edit-cliente/:id', (req, res) => {
    const id = req.params.id;
    const nome = req.body.name;
    const email = req.body.email;
    // const user = "null";
    // const userId = req.body.userId;
    const cellphone = req.body.cellphone;
    const password = req.body.password;
    const peso = req.body.peso
    const gordura = req.body.gordura
    const abdomen = req.body.abdomen
    const braco = req.body.braco
    const peitoral = req.body.peitoral

    const validate = { nome, email, password, cellphone, password, peso, gordura, abdomen, braco, peitoral  };

    knex('clientes').where({ id: id }).update(validate)
        .then(() => {
            console.log('Aluno atualizado com sucesso!', [validate]);
            res.redirect(`/admin/edit-cliente/${id}`);
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

// Cria alimento 
router.get('/create-alimento', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createAlimento', {user: user, title: 'Criar Alimento' })
})
router.post('/create-alimento', (req, res) => {

    const name = req.body.name;
    const quantidade = req.body.quantidade;
    const unidadeMD = req.body.unidadeMD;
    const caloria = req.body.caloria; // nutrientes que se destacam por fornecer energia para o corpo;
    const carboidrato = req.body.carboidrato;// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteina = req.body.proteina//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const gordura = req.body.gordura//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
        
    // Insere os dados do personais no banco de dados
    knex('alimentos').insert({
        nome: name,
        quantidade: quantidade,
        unidadeMD: unidadeMD,
        caloria: caloria, // nutrientes que se destacam por fornecer energia para o corpo;
        carboidrato: carboidrato,// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
        proteina: proteina,//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
        gordura: gordura,//: nutrientes relacionados com as mais diversas funções do organismo, como fortalecimento do sistema imunológico, manutenção de tecidos e a realização dos processos metabólicos.
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
router.get('/list-alimentos', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const alimentos = knex.select('*').from('alimentos');
        alimentos.then((alimentos) => {
            console.log('alimentos:', alimentos);
            res.render('./boardMain/listAlimentos', {user: user, title: 'Listar Alimento', alimento: alimentos })
        })

    } catch (error) {
        console.error('Erro ao listar os alimentos:', error);
    }

})
// Edição dos Alimentos 
router.get('/edit-alimento/:id',authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const alimentos = knex.select('*').from('alimentos').where({ id: id }).first();
        alimentos.then((alimentos) => {
            if (alimentos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum post encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editAlimento', {user: user, title: 'Editar Alimento', id: id, alimentos: alimentos })
        })
    } catch (error) {
        console.error('Erro ao selecionar o alimento:', error);
    }
})
router.post('/edit-alimento/:id', (req, res) => {
    const id = req.params.id
    const nome = req.body.name;
    const quantidade = req.body.quantidade;
    const unidadeMD = req.body.unidadeMD;
    const caloria = req.body.caloria; // nutrientes que se destacam por fornecer energia para o corpo;
    const carboidrato = req.body.carboidrato;// nutrientes que servem de reserva de energia, ajudam a absorver algumas vitaminas, além de proteger contra choques mecânicos e o frio;
    const proteina = req.body.proteina//: nutrientes fundamentais para o crescimento e manutenção dos tecidos do corpo.
    const gordura = req.body.gordura

    const validate = {
        nome, quantidade, unidadeMD, carboidrato, caloria,
        proteina, gordura
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
router.get('/create-suplemento',authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createSuplemento', {user: user, title: 'Criar Suplemento' })
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
router.get('/list-suplementos',authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const suplementos = knex.select('*').from('suplementos');
        suplementos.then((suplementos) => {
            console.log('alimentos:', suplementos);
            res.render('./boardMain/listSuplementos', {user: user, title: 'Listar Alimento', suplemento: suplementos })
        })

    } catch (error) {
        console.error('Erro ao listar os suplementos:', error);
    }

})
// Editar suplemento
router.get('/edit-suplemento/:id',authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const suplementos = knex.select('*').from('suplementos').where({ id: id }).first();
        suplementos.then((suplementos) => {
            if (suplementos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum suplemento encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editSuplemento', {user: user, title: 'Editar Suplemento', id: id, suplementos: suplementos })
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
router.get('/create-ergogenico', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createErgogenico', {user: user, title: 'Criar Ergogenico' })
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
router.get('/list-ergogenico', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const ergogenicos = knex.select('*').from('ergogenicos');
        ergogenicos.then((ergogenicos) => {
            console.log('ergogenicos:', ergogenicos);
            res.render('./boardMain/listErgogenicos', {user: user, title: 'Listar Ergogenicos', ergogenico: ergogenicos })
        })

    } catch (error) {
        console.error('Erro ao listar os ergogenicos:', error);
    }

})
// Editar ergogênico
router.get('/edit-ergogenico/:id', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const ergogenicos = knex.select('*').from('ergogenicos').where({ id: id }).first();
        ergogenicos.then((ergogenicos) => {
            if (ergogenicos) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum ergogenico encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editErgogenico', {user: user, title: 'Editar Ergogenico', id: id, ergogenicos: ergogenicos })
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





// Criar grupamento muscular
router.get('/create-gpmuscular', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createGPmuscular', {user: user, title: 'Criar GP' })
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
router.get('/list-gpmuscular', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const gpmusculares = knex.select('*').from('gpmuscular');
        gpmusculares.then((gpmusculares) => {
            console.log('exercicios:', gpmusculares);
            res.render('./boardMain/listGPmuscular', {user: user, title: 'Listar Exercicios', gpmuscular: gpmusculares })
        })

    } catch (error) {
        console.error('Erro ao listar os gpmusculares', error);
    }

})
// Editar grupamento muscular
router.get('/edit-gpmuscular/:id', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const gpmuscular = knex.select('*').from('gpmuscular').where({ id: id }).first();
        gpmuscular.then((gpmuscular) => {
            if (gpmuscular) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum gpmuscular encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editGPmuscular', {user: user, title: 'Editar GP muscular', id: id, gpmuscular: gpmuscular })
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


// Rota para criar um treino e associar a um cliente
router.get('/create-treino', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    try {
        // Obter todos os clientes vinculados ao profissional
        const clientes = await knex('clientes').where('profissionalId', req.user.id).select('*');
        
        // Renderizar a página de criação de treino com os clientes
        res.render('./boardMain/createTreino', { user: user, clientes });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).send('Erro ao carregar a página de criação de treino.');
    }
});
// Rota POST para criar um treino
router.post('/create-treino', async (req, res) => {
    const { nome_do_treino, descricao_do_treino, objetivo_do_treino, clienteId, exercicios } = req.body;

    try {
        // Inserir o treino no banco de dados
        const [treinoId] = await knex('treinos').insert({
            nome_do_treino,
            descricao_do_treino,
            objetivo_do_treino,
            clienteId // Vincular o treino ao cliente selecionado
        });

        console.log(`Treino criado com sucesso, ID: ${treinoId}`);

        // Verificar se há exercícios para serem vinculados
        if (exercicios && exercicios.length > 0) {
            for (const exercicio of exercicios) {
                const { id, series, repeticoes, carga } = exercicio;

                // Inserir cada exercício vinculado ao treino na tabela 'treino_exercicio'
                await knex('treino_exercicio').insert({
                    treinoId: treinoId,
                    exercicioId: id,
                    series: series,
                    repeticoes: repeticoes,
                    carga: carga
                });
            }
        }

        res.redirect('/admin/list-treinos'); // Redireciona para uma página de sucesso
    } catch (error) {
        console.error('Erro ao criar o treino:', error);
        res.status(500).send('Erro ao criar o treino.');
    }
});
// Listar treino
router.get('/list-treinos', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const treinos = knex.select('*').from('treinos');
        treinos.then((treinos) => {
            console.log('exercicios:', treinos);
            res.render('./boardMain/listTreinos', {user: user, title: 'Listar Exercicios', treino: treinos })
        })

    } catch (error) {
        console.error('Erro ao listar os gpmusculares', error);
    }

})
// Editar treino
// Rota para editar um treino e exibir exercícios cadastrados
router.get('/edit-treino/:id', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    const id = req.params.id;

    try {
        // Buscar o treino com o ID fornecido
        const treino = await knex('treinos').where('id', id).first();
        if (!treino) {
            return res.status(404).send('Nenhum treino encontrado com o ID fornecido.');
        }

        // Buscar todas as sessões associadas ao treino
        const sessoes = await knex('sessoes')
            .where('treinoId', id)
            .select('*');

        // Para cada sessão, buscar os exercícios associados via join
        for (let sessao of sessoes) {
            const exercicios = await knex('sessao_exercicio')
                .join('exercicios', 'sessao_exercicio.exercicioId', '=', 'exercicios.id')
                .where('sessao_exercicio.sessaoId', sessao.id)
                .select('exercicios.*', 'sessao_exercicio.series', 'sessao_exercicio.repeticoes', 'sessao_exercicio.carga', 'sessao_exercicio.unidade_de_medida_carga', 'sessao_exercicio.equipamento_necessario', 'sessao_exercicio.tempo_de_descanso', 'sessao_exercicio.nivel_de_dificuldade'); 
                // Certifique-se de que essas colunas existam em 'sessao_exercicio'

            sessao.exercicios = exercicios;
        }

        // Buscar todos os exercícios cadastrados no banco (para permitir adição de novos exercícios)
        const todosExercicios = await knex('exercicios').select('*');

        // Renderizar a view com os dados do treino completo, incluindo sessões e exercícios
        res.render('./boardMain/editTreino', {
            title: 'Editar Treino',
            id: id,
            treino: treino,
            sessoes: sessoes,  // Passar as sessões com seus exercícios para a view
            exercicios: todosExercicios,  // Passar todos os exercícios para o select de adição
            user: user
        });

    } catch (error) {
        console.error('Erro ao selecionar o treino e seus dados associados:', error);
        res.status(500).send('Erro ao selecionar o treino e seus dados associados.');
    }
});


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

// Rota para criar sessões de treino
router.post('/create-sessao', (req, res) => {
    const { nome_da_sessao, treinoId } = req.body; // Alterado para treinoId, uma vez que estamos lidando com sessões e treinos

    knex('sessoes')
        .insert({ nome_da_sessao: nome_da_sessao, treinoId : 1}) // Alterado para 'sessoes' e 'treinoId'
        .then(() => {
            res.redirect(`/admin/edit-treino/${treinoId}`); // Redireciona para a página de edição do treino
        })
        .catch(error => {
            console.error('Erro ao criar sessão:', error);
            res.status(500).send('Erro ao criar sessão');
        });
});


router.post('/add-exercicio-sessao', (req, res) => {
    const { sessaoId, exercicioId, series, repeticoes, carga, treinoId } = req.body;

    // Verificar se os campos obrigatórios estão presentes
    if (!sessaoId || !exercicioId || !series || !repeticoes || !carga) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // Inserir o exercício na sessão
    knex('exercicio_sessao')
        .insert({ sessaoId, exercicioId, series, repeticoes, carga })
        .then(() => {
            res.redirect(`/admin/edit-treino/${treinoId}`);
        })
        .catch(error => {
            console.error('Erro ao adicionar exercício à sessão:', error);
            res.status(500).send('Erro ao adicionar exercício à sessão');
        });
});
router.post('/update-sessao/:id', async (req, res) => {
    const sessaoId = req.params.id;
    const treinoId = req.body.treinoId;
    const nomeSessao = req.body.nome_sessao;

    // Reestruturando os dados dos exercícios
    const exercicios = [];
    Object.keys(req.body).forEach((key) => {
        const match = key.match(/^exercicios\[(\d+)\]\[(\w+)\]$/);
        if (match) {
            const index = match[1];
            const field = match[2];

            if (!exercicios[index]) {
                exercicios[index] = {}; // Inicializar o objeto se ainda não existir
            }

            exercicios[index][field] = req.body[key]; // Atribuir o valor ao campo correspondente
        }
    });

    try {
        // Atualizar o nome da sessão
        await knex('sessoes')
            .where('id', sessaoId)
            .update({ nome: nomeSessao });

        // Processar cada exercício
        for (const exercicio of exercicios) {
            if (exercicio.id) {
                // Atualizar exercício existente
                await knex('exercicios')
                    .where('id', exercicio.id)
                    .update({
                        nome: exercicio.nome,
                        series: exercicio.series,
                        repeticoes: exercicio.repeticoes,
                        carga: exercicio.carga
                    });
            } else {
                // Inserir novo exercício
                await knex('exercicios')
                    .insert({
                        nome: exercicio.nome,
                        series: exercicio.series,
                        repeticoes: exercicio.repeticoes,
                        carga: exercicio.carga,
                        sessao_id: sessaoId // Relaciona o exercício com a sessão
                    });
            }
        }

        // Redirecionar após sucesso
        res.redirect(`/admin/edit-treino/${treinoId}`);
    } catch (error) {
        console.error('Erro ao atualizar sessão e exercícios:', error);
        res.status(500).send('Erro ao atualizar sessão e exercícios.');
    }
});
// Rota para deletar uma sessão de treino
router.post('/delete-sessao/:id', async (req, res) => {
    const sessaoId = req.params.id;
    const treinoId = req.body.treinoId; // Confirme se o treinoId está sendo passado

    try {
        // Verifique se o treino existe
        const treino = await knex('treinos').where('id', treinoId).first();
        if (!treino) {
            return res.status(404).send('Nenhum treino encontrado com o ID fornecido.');
        }

        // Excluir exercícios associados à sessão
        await knex('exercicios').where('sessao_id', sessaoId).del();

        // Excluir a sessão
        await knex('sessoes').where('id', sessaoId).del();

        // Redirecionar para a página de edição do treino
        res.redirect(`/admin/edit-treino/${treinoId}`);
    } catch (error) {
        console.error('Erro ao excluir sessão e exercícios:', error);
        res.status(500).send('Erro ao excluir sessão e exercícios.');
    }
});
// Rota para atualizar um exercício
router.post('/update-exercicio/:id', async (req, res) => {
    const exercicioId = req.params.id;
    const { nome_exercicio, series, repeticoes, carga, treinoId } = req.body;

    try {
        // Atualizar o exercício com os dados fornecidos
        await knex('exercicios')
            .where({ id: exercicioId })
            .update({
                nome: nome_exercicio,
                series: series,
                repeticoes: repeticoes,
                carga: carga
            });

        console.log(`Exercício ID ${exercicioId} atualizado com sucesso.`);
        res.redirect(`/admin/edit-treino/${treinoId}`); // Redireciona de volta para a edição do treino
    } catch (error) {
        console.error('Erro ao atualizar o exercício:', error);
        res.status(500).send('Erro ao atualizar o exercício.');
    }
});




// Criar Exercicio
router.get('/create-exercicio', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    res.render('./boardMain/createExercicio', { user: user, title: 'Criar Eexercicio' })
})
router.post('/create-exercicio',  (req, res) => {
    const nome_do_exercicio = req.body.nome_do_exercicio;
    const descricao = req.body.descricao;
    const grupamento_muscular = req.body.grupamento_muscular;
    // Insere os dados do personais no banco de dados

    knex('exercicios').insert({
        nome_do_exercicio: nome_do_exercicio,
        descricao: descricao,
        grupamento_muscular: grupamento_muscular,
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
router.get('/list-exercicios', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    // Função para listar todos os alimentos do banco de dados
    try {
        const exercicios = knex.select('*').from('exercicios');
        exercicios.then((exercicios) => {
            console.log('exercicios:', exercicios);
            res.render('./boardMain/listExercicios', {user: user, title: 'Listar Exercicios', exercicio: exercicios })
        })

    } catch (error) {
        console.error('Erro ao listar os exercicios', error);
    }

})
// Editar exercicio
router.get('/edit-exercicio/:id', authenticateToken, getUserDetails, authorizeProfessional,(req, res) => {
    const user = req.userDetails;
    var id = req.params.id;
    try {
        const exercicios = knex.select('*').from('exercicios').where({ id: id }).first();
        exercicios.then((exercicios) => {
            if (exercicios) {
                // console.log('personais encontrado:', personais);
            } else {
                console.log('Nenhum exercicio encontrado com o ID fornecido.');
            }
            res.render('./boardMain/editExercicio', {user: user, title: 'Editar Exercicio', id: id, exercicios: exercicios })
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
    // Insere os dados do personais no banco de dadosc

    const validate = {
        nome_do_exercicio, descricao, grupamento_muscular, series,
        repeticoes_por_serie, carga_por_lado, unidade_de_medida_carga,
        equipamento_necessario, tempo_de_descanso, nivel_de_dificuldade
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


// router.post('/criar-dieta', async (req, res) => {
//     const {
//         nome_da_dieta,
//         descricao_da_dieta,
//         objetivo_da_dieta,
//         duracao_estimada,
//         nivel_de_dificuldade,
//         calorias_diarias,
//         proteinas,
//         carboidratos,
//         gorduras,
//         alimentos
//     } = req.body;

//     try {
//         // Inserindo a dieta
//         const [dieta_id] = await knex('dietas').insert({
//             nome_da_dieta,
//             descricao_da_dieta,
//             objetivo_da_dieta,
//             duracao_estimada,
//             nivel_de_dificuldade,
//             calorias_diarias,
//             proteinas,
//             carboidratos,
//             gorduras,
//             clienteId: 7,
//             alimentoId: 11,
//             // suplementoId: 3,
//             // ergogenicoId: 1 // Assumindo que você tem autenticação e o ID do usuário logado está disponível
//         });

//         // Inserindo os alimentos na dieta
//         // for (const alimento_id of alimentos) {
//         //     await knex('dietas').insert({
//         //         dieta_id,
//         //         alimento_id
//         //     });
//         // }

//         res.redirect(`/admin/list-dietas`); // Redirecionar para o perfil do cliente ou outro caminho desejado
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Erro ao criar dieta');
//     }
// });
router.get('/alimentos', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    try {
        const alimentos = await knex('alimentos').select('id', 'nome');
        res.json(alimentos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar alimentos');
    }
});
router.get('/create-dieta', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    try {
        // Obter todos os clientes vinculados ao profissional
        const clientes = await knex('clientes').where('profissionalId', req.user.id).select('*');
        
        res.render('./boardMain/createDieta', { user: user, clientes });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).send('Erro ao carregar a página de criação de dieta.');
    }
});

router.post('/create-dieta', async (req, res) => {
    const { nome_da_dieta, descricao_da_dieta, objetivo_da_dieta, duracao_estimada, clienteId, alimentoId, calorias_diarias, carboidratos, gorduras, nivel_de_dificuldade, proteinas, ergogenicoId, suplementoId } = req.body;

    try {
        // Inserir a dieta no banco de dados
        await knex('dietas').insert({
            nome_da_dieta,
            descricao_da_dieta,
            objetivo_da_dieta,
            duracao_estimada,
            clienteId, // Vincular a dieta ao cliente selecionado
            // alimentoId,
            calorias_diarias,
            carboidratos,
            gorduras,
            nivel_de_dificuldade,
            proteinas,
            // ergogenicoId,
            // suplementoId
        });

        res.redirect('/admin/list-dietas'); // Redireciona para uma página de sucesso
    } catch (error) {
        console.error('Erro ao criar a dieta:', error);
        res.status(500).send('Erro ao criar a dieta.');
    }
}); 
router.post('/create-refeicao', (req, res) => {
    const { nome, dietaId } = req.body;

    knex('refeicoes')
        .insert({ nome, dietaId })
        .then(() => {
            res.redirect(`/admin/edit-dieta/${dietaId}`);
        })
        .catch(error => {
            console.error('Erro ao criar refeição:', error);
            res.status(500).send('Erro ao criar refeição');
        });
});
router.post('/add-alimento-refeicao', (req, res) => {
    const { refeicaoId, alimentoId, quantidade, dietaId } = req.body;

    // Verificar se os campos obrigatórios estão presentes
    if (!refeicaoId || !alimentoId || !quantidade) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    knex('refeicao_alimentos')
        .insert({ refeicaoId, alimentoId, quantidade })
        .then(() => {
            res.redirect(`/admin/edit-dieta/${dietaId}`);
        })
        .catch(error => {
            console.error('Erro ao adicionar alimento à refeição:', error);
            res.status(500).send('Erro ao adicionar alimento à refeição');
        });
});
// Atualizar refeição e alimentos
router.post('/update-refeicao/:id', async (req, res) => {
    const refeicaoId = req.params.id;
    const dietaId = req.body.dietaId;
    const nomeRefeicao = req.body.nome_refeicao;

    // Reestruturando os dados dos alimentos
    const alimentos = [];
    Object.keys(req.body).forEach((key) => {
        const match = key.match(/^alimentos\[(\d+)\]\[(\w+)\]$/);
        if (match) {
            const index = match[1];
            const field = match[2];

            if (!alimentos[index]) {
                alimentos[index] = {}; // Inicializar o objeto se ainda não existir
            }

            alimentos[index][field] = req.body[key]; // Atribuir o valor ao campo correspondente
        }
    });

    try {
        // Atualizar o nome da refeição
        await knex('refeicoes')
            .where('id', refeicaoId)
            .update({ nome: nomeRefeicao });

        // Processar cada alimento
        for (const alimento of alimentos) {
            if (alimento.id) {
                // Atualizar alimento existente
                await knex('alimentos')
                    .where('id', alimento.id)
                    .update({
                        nome: alimento.nome,
                        quantidade: alimento.quantidade
                    });
            } else {
                // Inserir novo alimento
                await knex('alimentos')
                    .insert({
                        nome: alimento.nome,
                        quantidade: alimento.quantidade,
                        refeicao_id: refeicaoId // Relaciona o alimento com a refeição
                    });
            }
        }

        // Redirecionar após sucesso
        res.redirect(`/admin/edit-dieta/${dietaId}`);
    } catch (error) {
        console.error('Erro ao atualizar refeição e alimentos:', error);
        res.status(500).send('Erro ao atualizar refeição e alimentos.');
    }
});
// Rota para deletar uma refeição
// Rota para deletar uma refeição
router.post('/delete-refeicao/:id', async (req, res) => {
    const refeicaoId = req.params.id;
    const dietaId = req.body.dietaId; // Confirme se o dietaId está sendo passado

    try {
        // Verifique se a dieta existe
        const dieta = await knex('dietas').where('id', dietaId).first();
        if (!dieta) {
            return res.status(404).send('Nenhuma dieta encontrada com o ID fornecido.');
        }

        // Excluir alimentos associados à refeição
        await knex('alimentos').where('refeicaoId', refeicaoId).del();

        // Excluir a refeição
        await knex('refeicoes').where('id', refeicaoId).del();

        // Redirecionar para a página de edição da dieta
        res.redirect(`/admin/edit-dieta/${dietaId}`);
    } catch (error) {
        console.error('Erro ao excluir refeição e alimentos:', error);
        res.status(500).send('Erro ao excluir refeição e alimentos.');
    }
});
// Rota para atualizar um alimento
router.post('/update-alimento/:id', async (req, res) => {
    const alimentoId = req.params.id;
    const { nome_alimento } = req.body;

    try {
        await knex('alimentos')
            .where({ id: alimentoId })
            .update({ nome: nome_alimento });

        console.log(`Alimento ID ${alimentoId} atualizado com sucesso.`);
        res.redirect(`/admin/edit-dieta/${req.body.dietaId}`); // Redireciona de volta para a edição da dieta
    } catch (error) {
        console.error('Erro ao atualizar o alimento:', error);
        res.status(500).send('Erro ao atualizar o alimento.');
    }
});

// Criar Dieta 
// router.get('/create-dieta', (req, res) => {
//     res.render('./boardMain/createDieta', { title: 'Criar Dieta' })
// })
// router.post('/create-dieta', (req, res) => {
//     const nome_da_dieta = req.body.nome_da_dieta;
//     const descricao_da_dieta = req.body.descricao_da_dieta;
//     const objetivo_da_dieta = req.body.objetivo_da_dieta;
//     const duracao_estimada = req.body.duracao_estimada;
//     const nivel_de_dificuldade = req.body.nivel_de_dificuldade;
//     const calorias_diarias = req.body.calorias_diarias;
//     const proteinas = req.body.proteinas;
//     const carboidratos = req.body.carboidratos;
//     const gorduras = req.body.gorduras;
//     const clienteId = req.body.clienteId
//     // Insere os dados do personais no banco de dados

//     knex('dietas').insert({
//         nome_da_dieta: nome_da_dieta,
//         descricao_da_dieta: descricao_da_dieta,
//         objetivo_da_dieta: objetivo_da_dieta,
//         duracao_estimada: duracao_estimada,
//         nivel_de_dificuldade: nivel_de_dificuldade,
//         calorias_diarias: calorias_diarias,
//         proteinas: proteinas,
//         carboidratos: carboidratos,
//         gorduras: gorduras,
//         clienteId: clienteId,
//         alimentoId: 16,
//         suplementoId: 3,
//         ergogenicoId: 1
//     })
//         .then((dietas) => {
//             res.redirect('/admin/list-dietas'); // Move a chamada para dentro deste callback
//         })
//         .catch((error) => {
//             console.error('Erro ao inserir o treino:', error);
//             res.status(500).send(`Erro ao inserir o treino: ${error.message}`);
//         });
// })
// Listar Dieta 
router.get('/list-dietas', authenticateToken, getUserDetails, authorizeProfessional, (req, res) => {
    const user = req.userDetails;
    const profissionalId = req.user.id;
   
    // Buscar todos os clientes vinculados ao profissional logado
    knex('clientes')
        .where('profissionalId', profissionalId)
        .select('id')
        .then(clienteIds => {
            const ids = clienteIds.map(cliente => cliente.id);

            // Buscar todas as dietas associadas aos IDs dos clientes
            return knex('dietas')
                .whereIn('clienteId', ids)
                .select('*');
        })
        .then(dietas => {
            // Renderizar a view com as dietas encontradas
            res.render('boardMain/listDietas', { user: user, dieta: dietas });
        })
        .catch(error => {
            console.error('Erro ao listar dietas:', error);
            res.status(500).send('Erro ao listar dietas');
        });
});
// Rota para editar uma dieta e exibir alimentos cadastrados
router.get('/edit-dieta/:id', authenticateToken, getUserDetails, authorizeProfessional, async (req, res) => {
    const user = req.userDetails;
    const id = req.params.id;
    
    try {
        // Buscar a dieta com o ID fornecido
        const dieta = await knex('dietas').where('id', id).first();
        if (!dieta) {
            return res.status(404).send('Nenhuma dieta encontrada com o ID fornecido.');
        }

        // Buscar todas as refeições associadas à dieta
        const refeicoes = await knex('refeicoes')
            .where('dietaId', id)
            .select('*');

        // Para cada refeição, buscar os alimentos associados via join
        for (let refeicao of refeicoes) {
            const alimentos = await knex('refeicao_alimento')
                .join('alimentos', 'refeicao_alimento.alimentoId', '=', 'alimentos.id')
                .where('refeicao_alimento.refeicaoId', refeicao.id)
                .select('alimentos.*', 'refeicao_alimento.quantidade'); // Seleciona os dados do alimento e a quantidade

            refeicao.alimentos = alimentos;
        }

        // Buscar todos os alimentos cadastrados no banco (para permitir adição de novos alimentos)
        const todosAlimentos = await knex('alimentos').select('*');

        // Renderizar a view com os dados da dieta completa, incluindo refeições e alimentos
        res.render('./boardMain/editDieta', {
            title: 'Editar Dieta',
            id: id,
            dieta: dieta,
            refeicoes: refeicoes,  // Passar as refeições com seus alimentos para a view
            alimentos: todosAlimentos,
            user: user,// Passar todos os alimentos para o select de adição
        });

    } catch (error) {
        console.error('Erro ao selecionar a dieta e seus dados associados:', error);
        res.status(500).send('Erro ao selecionar a dieta e seus dados associados.');
    }
});
router.post('/edit-dieta/:id', async (req, res) => {
    const dietaId = req.params.id;

    // Log completo do req.body para verificar os dados recebidos
    console.log('Dados recebidos no req.body:', JSON.stringify(req.body, null, 2));

    // Parseando os dados de req.body
    const parsedBody = qs.parse(req.body);
    const refeicoes = parsedBody.refeicoes;

    if (!refeicoes || Object.keys(refeicoes).length === 0) {
        console.log("Dados das refeições não enviados.");
        return res.status(400).send("Dados das refeições não enviados.");
    }

    try {
        // Itera sobre cada refeição
        for (const refeicaoIndex in refeicoes) {
            const refeicao = refeicoes[refeicaoIndex];
            console.log(`Processando a refeição: ${JSON.stringify(refeicao, null, 2)}`);

            // Verificar se o nome da refeição existe
            if (!refeicao.nome) {
                console.error("Nome da refeição não está definido.");
                continue; // Pula para a próxima refeição se o nome não estiver definido
            }

            // Inserir a refeição na tabela 'refeicoes'
            const [refeicaoId] = await knex('refeicoes').insert({
                nome: refeicao.nome,
                dietaId: dietaId
            }).returning('id');

            console.log(`Refeição criada com sucesso: ID ${refeicaoId}`);

            // Itera sobre cada alimento dentro da refeição
            for (const alimentoIndex in refeicao.alimentos) {
                const alimento = refeicao.alimentos[alimentoIndex];
                console.log(`Processando alimento: ${JSON.stringify(alimento, null, 2)}`);

                const alimentoId = alimento.id;
                const quantidade = alimento.quantidade;

                if (alimentoId) {
                    console.log(`Alimento encontrado: ID ${alimentoId}, Quantidade: ${quantidade}`);

                    // Relacionar o alimento com a refeição na tabela 'refeicao_alimento'
                    await knex('refeicao_alimento').insert({
                        refeicaoId: refeicaoId,
                        alimentoId: alimentoId,
                        quantidade: quantidade // Inserindo a quantidade na tabela
                    });

                    console.log(`Alimento ID ${alimentoId} relacionado com a Refeição ID ${refeicaoId} com quantidade ${quantidade}`);
                } else {
                    console.error("Alimento não pôde ser processado, ID ausente.");
                }
            }
        }

        res.redirect(`/admin/edit-dieta/${dietaId}`);
    } catch (error) {
        console.error('Erro ao salvar os dados:', error);
        res.status(500).send('Erro ao salvar os dados');
    }
});

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
            nome: nome,
            email: email,
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
        title: 'Logar Profissional',
        msg: ''
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
            res.render('./boardMain/login', {
                title: 'Logar Profissional',
                msg: 'Credenciais inválidas'
            })
        }
    } catch (error) {
        res.status(500).send('Erro ao realizar login');
    }
});
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Erro ao fazer logout');
        res.redirect('/admin/login');
    });
})

router.get('/forgotpass', (req, res, next) => {
    res.render('./boardMain/forgotPass', {
        title: 'Recuperar senha'
    })
})

//Criar protocolo

module.exports = router;