function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'seuSegredoJWT', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // Adiciona os dados do usuário ao objeto req
        next();
    });
}
const authenticateTokenn = authenticateToken()

module.exports = authenticateTokenn