var createError = require('http-errors');
const session = require('express-session');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


const fileUpload = require('express-fileupload');

var boardMain = require("./routes/boardMain");
var boardNutri = require('./routes/boardNutri');
var boardPersonal = require('./routes/boardPersonal');

var app = express();

app.use(session({
  secret: 'seuSegredoDeSessao', // Use uma chave secreta forte
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Se estiver em produção, defina secure: true e use HTTPS
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Configuração do middleware para o upload de arquivos
app.use(fileUpload());
// Serve o diretório 'uploads' de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'routes', 'uploads')));
// Serve o diretório 'uploads' de imagens de posts de blog (pasta dentro de 'myapp/uploads')
app.use('/uploads/exercicios', express.static(path.join(__dirname, 'uploads', 'exercicios')));

app.use('/admin', boardMain);
app.use('/nutri', boardNutri);
app.use('/personal', boardPersonal)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  console.error(err); // Adicionando esta linha para imprimir o erro no console
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  res.status(500).render('error', { error: err });

});


module.exports = app;
