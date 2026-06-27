/* ===================================================
   ALTURA COFFEE - Auth Engine (Mock Backend)
=================================================== */
const AuthEngine = {
    getUsers: () => JSON.parse(localStorage.getItem('altura_users_db')) || [],

    signup: function(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) return { success: false, message: "Email already exists!" };
        
        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        localStorage.setItem('altura_users_db', JSON.stringify(users));
        return this.login(email, password);
    },

    login: function(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const session = { userId: user.id, name: user.name, email: user.email };
            localStorage.setItem('altura_session', JSON.stringify(session));
            localStorage.setItem('altura_logged_in', 'true');
            return { success: true, user: session };
        }
        return { success: false, message: "Invalid credentials!" };
    },

    logout: function() {
        localStorage.removeItem('altura_session');
        localStorage.setItem('altura_logged_in', 'false');
        window.location.href = 'index.html';
    },

    getSession: () => JSON.parse(localStorage.getItem('altura_session'))
};
