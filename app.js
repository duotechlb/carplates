// ===== SUPABASE CONFIG =====
// ⚠️ REPLACE THESE WITH YOUR REAL KEYS
const SUPABASE_URL = 'https://jmcrdseocalgemhokkmz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptY3Jkc2VvY2FsZ2VtaG9ra216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzEzMjgsImV4cCI6MjA5MTA0NzMyOH0.w1FStIwy0SS2YbwIQQfhRxq-4XRGxGFe_vjTDmB3YZU';

// ⚠️ REPLACE WITH YOUR WHATSAPP NUMBER (Lebanon format: 96170123456)
const WHATSAPP_NUMBER = '96176419154';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== PAGINATION STATE =====
let currentPage = 1;
const PAGE_SIZE = 50;
let currentQuery = '';
let currentField = 'all';
let totalResults = 0;

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {

    // Set WhatsApp link
    const waLink = document.getElementById('whatsappLink');
    if (waLink) {
        waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I want to subscribe to CarPlatesLB for $2/month`;
    }

    // If on dashboard, check auth
    if (window.location.pathname.includes('dashboard.html')) {
        const user = sessionStorage.getItem('carplates_user');
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('navUser').textContent = '👤 ' + user;
    }
});

// ===== LOGIN =====
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    if (!username || !password) {
        errorDiv.textContent = '⚠️ Please enter both username and password.';
        errorDiv.style.display = 'block';
        return;
    }

    btn.textContent = 'Checking...';
    btn.classList.add('loading');
    errorDiv.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .eq('active', true)
            .single();

        if (data) {
            sessionStorage.setItem('carplates_user', data.name || username);
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.textContent = '❌ Invalid credentials or account not active. Contact us on WhatsApp.';
            errorDiv.style.display = 'block';
            btn.textContent = 'Login';
            btn.classList.remove('loading');
        }
    } catch (e) {
        errorDiv.textContent = '❌ Invalid credentials. Please try again.';
        errorDiv.style.display = 'block';
        btn.textContent = 'Login';
        btn.classList.remove('loading');
    }
}

// Allow Enter key on login
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('loginBtn')) {
        login();
    }
});

// ===== LOGOUT =====
function logout() {
    sessionStorage.removeItem('carplates_user');
    window.location.href = 'index.html';
}

// ===== SEARCH =====
async function searchCars() {
    const query = document.getElementById('searchInput').value.trim();
    const field = document.getElementById('filterField').value;

    if (!query) {
        alert('Please enter a search term.');
        return;
    }

    currentQuery = query;
    currentField = field;
    currentPage = 1;

    await fetchResults();
}

async function fetchResults() {
    const loading = document.getElementById('loading');
    const pagination = document.getElementById('pagination');
    const resultCount = document.getElementById('resultCount');

    loading.style.display = 'block';
    document.getElementById('resultsBody').innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#475569;">Searching...</td></tr>';

    try {
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from('cars')
            .select('actualnb, codedesc, prenom, nom, marquedesc, couleurdesc, typedesc, telprop, addresse', { count: 'exact' });

        // Build search query based on selected field
        if (currentField === 'all') {
            query = query.or(
                `actualnb.ilike.%${currentQuery}%,` +
                `nom.ilike.%${currentQuery}%,` +
                `prenom.ilike.%${currentQuery}%,` +
                `marquedesc.ilike.%${currentQuery}%,` +
                `chassis.ilike.%${currentQuery}%,` +
                `addresse.ilike.%${currentQuery}%`
            );
        } else {
            query = query.ilike(currentField, `%${currentQuery}%`);
        }

        query = query.range(from, to);

        const { data, error, count } = await query;

        loading.style.display = 'none';

        if (error) {
            console.error(error);
            document.getElementById('resultsBody').innerHTML = '<tr><td colspan="9" style="text-align:center;color:#ef4444;padding:40px;">Search error. Please try again.</td></tr>';
            return;
        }

        totalResults = count || 0;
        displayResults(data);

        // Show result count
        resultCount.innerHTML = `Found <strong>${totalResults.toLocaleString()}</strong> result(s)`;

        // Pagination
        if (totalResults > PAGE_SIZE) {
            pagination.style.display = 'flex';
            document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${Math.ceil(totalResults / PAGE_SIZE)}`;
            document.getElementById('prevBtn').disabled = currentPage === 1;
            document.getElementById('nextBtn').disabled = currentPage >= Math.ceil(totalResults / PAGE_SIZE);
        } else {
            pagination.style.display = 'none';
        }

    } catch (e) {
        loading.style.display = 'none';
        console.error(e);
    }
}

// ===== DISPLAY RESULTS =====
function displayResults(cars) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    if (!cars || cars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:60px;color:#475569;">No results found for your search.</td></tr>';
        return;
    }

    cars.forEach(car => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${car.actualnb || '—'}</td>
            <td>${car.codedesc || '—'}</td>
            <td>${car.prenom || '—'}</td>
            <td>${car.nom || '—'}</td>
            <td>${car.marquedesc || '—'}</td>
            <td>${car.couleurdesc || '—'}</td>
            <td>${car.typedesc || '—'}</td>
            <td>${car.telprop || '—'}</td>
            <td>${car.addresse || '—'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== PAGINATION =====
async function nextPage() {
    currentPage++;
    await fetchResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        await fetchResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ===== CLEAR SEARCH =====
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('resultCount').innerHTML = '';
    document.getElementById('resultsBody').innerHTML = '<tr class="empty-row"><td colspan="9">👆 Enter a search term above to find vehicle records</td></tr>';
    document.getElementById('pagination').style.display = 'none';
}
