function authorizeProfessional(req, res, next) {
    if (req.user.tipo !== 'profissional') {
        return res.status(403).send('Acesso negado');
    }
    next();
}
