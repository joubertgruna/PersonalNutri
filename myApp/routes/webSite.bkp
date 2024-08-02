var express = require('express');
var router = express.Router();
const knex = require('../db/conn');

/* GET users listing. */
router.get('/', function (req, res, next) {
  try {
    const postagemBlog = knex.select('*').from('blog').orderBy('created_at', 'desc').limit(3);
    postagemBlog.then((postagemBlog) => {
      console.log('Candidatos:', postagemBlog);
      res.render('./webSite/index', { title: 'Express', postagens: postagemBlog });
    })
  } catch (error) {
    console.error('Erro ao listar os posts:', error);
  }
});

router.get('/sobre', ((req, res) => {
  res.render('./webSite/about')
}))

router.get('/servicos', (req, res) => {
  res.render('./webSite/service')
})

router.get('/srv-diagnostico', (req, res) => {
  res.render('./webSite/srv-diagnostico')
})

router.get('/srv-atracao', (req, res) => {
  res.render('./webSite/srv-atracao')
})

router.get('/srv-gestao', (req, res) => {
  res.render('./webSite/srv-gestao')
})

router.get('/srv-treinamento', (req, res) => {
  res.render('./webSite/srv-treinamento')
})

router.get('/vagas', (req, res) => {
  try {
    const postagemVagas = knex.select('*').from('vagas').orderBy('id','DESC');
    postagemVagas
      .then((postagemVagas) => {
        // console.log('Candidatos:', postagemVagas);
        res.render('./webSite/vagas', { title: 'Express', vagas: postagemVagas });
      })
  } catch (error) {
    console.error('Erro ao listar as vagas:', error);
  }

})


router.get('/vagas-single/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const vaga = await knex.select('*').from('vagas').where({ id: id }).first();
    if (vaga) {
      res.render('./webSite/vagas-single', { title: 'Express', vagas: vaga, descricao: formatarDescricao(vaga.descricao) }); //formatarDescricao() });
    } else {
      console.log('Nenhuma vaga encontrada com o ID fornecido.');
      res.status(404).send('Nenhuma vaga encontrada com o ID fornecido.');
    }
  } catch (error) {
    console.error('Erro ao selecionar a vaga:', error);
    res.status(500).send('Erro ao selecionar a vaga');
  }

  // Função para processar a descrição como HTML diretamente no arquivo .ejs
  function formatarDescricao(descricao) {
    // Aqui você pode adicionar qualquer processamento necessário para transformar a descrição em HTML
    // Por exemplo, substituir quebras de linha por tags <p> ou <br>
    // Neste exemplo, simplesmente substituiremos as quebras de linha por <br>
    return descricao.replace(/\n/g, '<br>');
  }
});


router.get('/projetos', (req, res) => {
  res.render('./webSite/project')
})

router.get('/blog', (req, res) => {
  try {
    const postagemBlog = knex.select('*').orderBy('created_at', 'desc').from('blog');
    postagemBlog.then((postagemBlog) => {
      // console.log('Candidatos:', candidatos);
      res.render('./webSite/blog-grid', { title: 'Express', postagens: postagemBlog });
    })
  } catch (error) {
    console.error('Erro ao listar os posts:', error);
  }

})

router.get('/blog-single/:id', (req, res) => {
  var id = req.params.id
  try {
    const listagemVaga = knex.select('*').from('blog').where({ id: id }).first();
    listagemVaga.then((blog) => {
      if (blog) {
        // console.log('Candidato encontrado:', candidato);
      } else {
        console.log('Nenhuma vaga encontrado com o ID fornecido.');
      }
      res.render('./webSite/blog-single', { title: 'Express', blog: blog });
    })
  } catch (error) {
    console.error('Erro ao selecionar a vaga:', error);
  }
})

router.get('/contato', (req, res) => {
  res.render('./webSite/contact')
})

router.get('/candidato', (req, res) => {
  res.render('./webSite/cadastroCandidato')
})

router.get('/conclusao', (req, res)=>{
  res.render('./webSite/conclusao')
})

router.get('/conclusao-talentos', (req, res)=>{
  res.render('./webSite/conclusao-bancoTalentos')
})


module.exports = router;
