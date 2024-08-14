function authorizeClient(req, res, next) {
    const clientId = req.params.id; // ID do cliente da rota, por exemplo, /clientes/:id/dietas
    
    if (req.user.tipo !== 'cliente' || req.user.id != clientId) {
        return res.status(403).send('Acesso negado');
    }
    next();
}
