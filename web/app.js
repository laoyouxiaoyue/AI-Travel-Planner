// AI旅行规划器前端应用
class TravelPlannerApp {
    constructor() {
        // 自动适配当前访问端口，避免写死端口
        this.apiBase = `${window.location.origin.replace(/\/$/, '')}/api/v1`;
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupDateInputs();
    }

    setupEventListeners() {
        // 导航菜单
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(link.getAttribute('href').substring(1));
            });
        });

        // 认证按钮
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // 模态框关闭
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 认证标签页
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAuthTab(tab);
            });
        });

        // 认证表单
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 创建行程
        document.getElementById('createPlanBtn').addEventListener('click', () => this.createTravelPlan());

        // 语音输入
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceInput());

        // 新建行程按钮
        document.getElementById('newPlanBtn').addEventListener('click', () => this.showPage('home'));

        // 添加费用按钮
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.showAddExpenseModal());

        // 设置页面相关
        document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchProfileTab(tab);
            });
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('testApiKeyBtn').addEventListener('click', () => this.testApiKey());

        // 为表单字段添加输入事件监听器，清除错误状态
        this.setupFormValidation();
        
        // 加载设置
        this.loadSettings();
    }

    setupFormValidation() {
        const formFields = ['destination', 'startDate', 'endDate', 'budget', 'people'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    field.classList.remove('error');
                });
                field.addEventListener('change', () => {
                    field.classList.remove('error');
                });
            }
        });
    }

    setupDateInputs() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        document.getElementById('startDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('endDate').value = nextWeek.toISOString().split('T')[0];
    }

    checkAuthStatus() {
        if (this.token) {
            this.loadUserProfile();
        } else {
            this.showAuthButtons();
        }
    }

    async loadUserProfile() {
        try {
            const response = await this.apiCall('/profile', 'GET');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showUserMenu();
                this.loadTravelPlans();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
            this.logout();
        }
    }

    showAuthButtons() {
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('registerBtn').style.display = 'inline-block';
        document.getElementById('userMenu').style.display = 'none';
    }

    showUserMenu() {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('userMenu').style.display = 'flex';
        document.getElementById('userName').textContent = this.currentUser.username;
    }

    showPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        document.getElementById(pageId).classList.add('active');

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${pageId}"]`).classList.add('active');

        // 加载页面数据
        if (pageId === 'plans') {
            this.loadTravelPlans();
        } else if (pageId === 'expenses') {
            this.loadExpenses();
        } else if (pageId === 'profile') {
            this.loadSettings();
        }
    }

    showAuthModal(type) {
        document.getElementById('authModal').style.display = 'block';
        this.switchAuthTab(type);
    }

    switchAuthTab(tab) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应表单
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                this.showUserMenu();
                document.getElementById('authModal').style.display = 'none';
                this.showMessage('登录成功！', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '登录失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                this.showUserMenu();
                document.getElementById('authModal').style.display = 'none';
                this.showMessage('注册成功！', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '注册失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.showAuthButtons();
        this.showPage('home');
        this.showMessage('已退出登录', 'success');
    }

    async createTravelPlan() {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }

        const destination = document.getElementById('destination').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const budgetInput = document.getElementById('budget').value.trim();
        const peopleInput = document.getElementById('people').value.trim();
        const preferences = document.getElementById('preferences').value.trim();

        // 清除之前的错误状态
        this.clearFieldErrors();

        // 验证必填字段
        const missingFields = [];
        const errorFields = [];
        
        if (!destination) {
            missingFields.push('目的地');
            errorFields.push('destination');
        }
        if (!startDate) {
            missingFields.push('出发日期');
            errorFields.push('startDate');
        }
        if (!endDate) {
            missingFields.push('返回日期');
            errorFields.push('endDate');
        }
        if (!budgetInput || isNaN(parseFloat(budgetInput)) || parseFloat(budgetInput) <= 0) {
            missingFields.push('预算');
            errorFields.push('budget');
        }
        if (!peopleInput || isNaN(parseInt(peopleInput)) || parseInt(peopleInput) < 1) {
            missingFields.push('人数');
            errorFields.push('people');
        }

        if (missingFields.length > 0) {
            this.highlightErrorFields(errorFields);
            this.showMessage(`请填写以下必填字段：${missingFields.join('、')}`, 'error');
            return;
        }

        // 转换数据类型并进一步验证
        const budget = parseFloat(budgetInput);
        const people = parseInt(peopleInput);

        // 验证日期逻辑
        if (new Date(startDate) >= new Date(endDate)) {
            this.showMessage('返回日期必须晚于出发日期', 'error');
            return;
        }

        // 获取用户配置的API Key
        const userApiKey = this.getUserApiKey();
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        const userBaseUrl = userSettings.openaiBaseUrl || 'https://api.openai.com/v1';
        const userModel = userSettings.openaiModel || '';

        const planData = {
            title: `${destination}旅行`,
            destination,
            start_date: startDate,
            end_date: endDate,
            budget,
            people,
            preferences: preferences ? { description: preferences } : {},
            // 传递用户配置的API Key（如果存在）
            openai_api_key: userApiKey || undefined,
            openai_base_url: userBaseUrl,
            openai_model: userModel
        };

        try {
            this.showLoading(document.getElementById('createPlanBtn'));
            const response = await this.apiCall('/travel/plan', 'POST', planData);
            
            if (response.ok) {
                const data = await response.json();
                this.showMessage('行程创建成功！', 'success');
                this.showPage('plans');
                this.loadTravelPlans();
            } else {
                const error = await response.json();
                this.showMessage(error.error || '创建行程失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请重试', 'error');
        } finally {
            this.hideLoading(document.getElementById('createPlanBtn'));
        }
    }

    async loadTravelPlans() {
        if (!this.token) return;

        try {
            const response = await this.apiCall('/travel/plans', 'GET');
            if (response.ok) {
                const data = await response.json();
                this.displayTravelPlans(data.plans || []);
            }
        } catch (error) {
            console.error('加载行程失败:', error);
        }
    }

    displayTravelPlans(plans) {
        const container = document.getElementById('plansList');
        if (plans.length === 0) {
            container.innerHTML = '<p>暂无行程，点击"新建行程"开始规划您的旅行！</p>';
            return;
        }

        container.innerHTML = plans.map(plan => `
            <div class="plan-card">
                <h3>${plan.title}</h3>
                <p><strong>目的地:</strong> ${plan.destination}</p>
                <p><strong>出发日期:</strong> ${plan.start_date}</p>
                <p><strong>返回日期:</strong> ${plan.end_date}</p>
                <p><strong>预算:</strong> ¥${plan.budget}</p>
                <p><strong>人数:</strong> ${plan.people}人</p>
                <p><strong>状态:</strong> ${plan.status}</p>
                <div class="plan-actions">
                    <button class="btn btn-primary" onclick="app.viewPlan('${plan.id}')">查看详情</button>
                    <button class="btn btn-outline" onclick="app.editPlan('${plan.id}')">编辑</button>
                    <button class="btn btn-outline" onclick="app.deletePlan('${plan.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    async loadExpenses() {
        if (!this.token) return;

        try {
            // 这里应该根据当前选择的行程加载费用
            // 简化实现，显示示例数据
            this.displayExpenses([]);
        } catch (error) {
            console.error('加载费用失败:', error);
        }
    }

    displayExpenses(expenses) {
        const container = document.getElementById('expensesList');
        if (expenses.length === 0) {
            container.innerHTML = '<p>暂无费用记录，点击"添加费用"开始记录您的支出！</p>';
            return;
        }

        // 实现费用列表显示
    }

    toggleVoiceInput() {
        const voiceBtn = document.getElementById('voiceBtn');
        const status = document.getElementById('voiceStatus');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> 停止录音';
            status.textContent = '正在听取您的语音...';
            voiceBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const container = document.getElementById('voiceResult');
            container.innerHTML = `
                <h4>识别结果:</h4>
                <p>${transcript.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                <button id="processVoiceBtn" class="btn btn-primary">处理语音输入</button>
            `;
            // 绑定点击事件，避免内联onclick在包含引号/特殊字符时失效
            const processBtn = document.getElementById('processVoiceBtn');
            if (processBtn) {
                processBtn.addEventListener('click', () => this.processVoiceInput(transcript));
            }
        };

        recognition.onerror = (event) => {
            this.showMessage('语音识别错误: ' + event.error, 'error');
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> 点击说话';
            status.textContent = '';
            voiceBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        };

        if (voiceBtn.textContent.includes('停止')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    async processVoiceInput(transcript) {
        const text = String(transcript || '').trim();
        const lower = text.toLowerCase();

        // 1) 优先调用后端大模型解析
        let result = null;
        try {
            const res = await this.apiCall('/voice/understand', 'POST', {
                transcript: text,
                openai_api_key: this.getUserApiKey() || undefined,
                openai_base_url: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiBaseUrl) || undefined,
                openai_model: (JSON.parse(localStorage.getItem('userSettings')||'{}').openaiModel) || undefined,
            });
            if (res.ok) {
                const data = await res.json();
                result = data.fields || null;
            }
        } catch (e) { /* 忽略，回退本地规则 */ }

        // 2) 回退到本地规则解析
        if (!result) {
            result = this.parseSpeechToFormData(text, lower);
        }

        // 写回表单（仅覆盖识别出的字段）
        if (result.destination) document.getElementById('destination').value = result.destination;
        if (result.startDate) document.getElementById('startDate').value = result.startDate;
        if (result.endDate) document.getElementById('endDate').value = result.endDate;
        if (typeof result.budget === 'number' && !Number.isNaN(result.budget)) document.getElementById('budget').value = String(result.budget);
        if (typeof result.people === 'number' && !Number.isNaN(result.people) && result.people > 0) document.getElementById('people').value = String(result.people);
        if (result.preferences && result.preferences.length > 0) {
            document.getElementById('preferences').value = result.preferences.join('、');
        }

        const summary = [
            result.destination ? `目的地：${result.destination}` : null,
            result.startDate && result.endDate ? `日期：${result.startDate} ~ ${result.endDate}` : null,
            typeof result.budget === 'number' ? `预算：¥${Math.round(result.budget)}` : null,
            typeof result.people === 'number' ? `人数：${result.people}人` : null,
            result.preferences?.length ? `偏好：${result.preferences.join('、')}` : null,
        ].filter(Boolean).join(' | ');

        this.showMessage(summary || '语音输入已处理，请检查表单内容', 'success');
    }

    // 将语音文本解析为表单字段
    parseSpeechToFormData(text, lower) {
        const now = new Date();
        const todayStr = this.formatDate(now);

        // 目的地提取：基于动词触发与地名后缀启发式
        let destination = '';
        const destTriggers = /(去|到|想去|打算去|目的地|去往|前往)([\u4e00-\u9fa5A-Za-z\s·\-]{1,20})/;
        const m1 = text.match(destTriggers);
        if (m1 && m1[2]) destination = m1[2].replace(/(玩|旅游|旅行|出差|看看|一下)$/,'').trim();
        // 后缀启发：xxx市/县/省/国/洲/州/岛/城
        if (!destination) {
            const m2 = text.match(/([\u4e00-\u9fa5A-Za-z·\-]{1,12})(市|县|省|国|洲|州|岛|城)/);
            if (m2) destination = (m2[1] + m2[2]).trim();
        }

        // 日期解析
        const explicit = this.extractDateRange(text);
        let startDate = explicit.start || '';
        let endDate = explicit.end || '';
        if (!startDate || !endDate) {
            // 相对日期 + 时长
            const rel = this.extractRelativeDates(text, now);
            startDate = startDate || rel.start || '';
            endDate = endDate || rel.end || '';
        }

        // 人数解析（含中文数字）
        let people = this.extractPeople(text);

        // 预算解析（支持“万/千/左右/大约”等）
        let budget = this.extractBudget(text);

        // 偏好关键词
        const preferences = this.extractPreferences(text);

        // 兜底：如有时长但缺结束日期，按3天补全
        if (startDate && !endDate) {
            const days = explicit.days || 0;
            const duration = days > 0 ? days : 3;
            endDate = this.formatDate(this.addDays(new Date(startDate), duration));
        }

        return { destination, startDate, endDate, people, budget, preferences };
    }

    // 金额解析：支持 “预算一万二/一千/5000块/大概8000左右”
    extractBudget(text) {
        if (!/(预算|花费|费用|经费|多少钱|钱)/.test(text)) return undefined;
        // 提取数值 + 单位
        const unitMatch = text.match(/([零一二三四五六七八九十百千万0-9\.]+)(万|千)?\s*(多|左右|上下)?\s*(元|块|人民币)?/);
        if (!unitMatch) return undefined;
        const num = this.parseChineseNumber(unitMatch[1]);
        if (isNaN(num)) return undefined;
        let amount = num;
        const unit = unitMatch[2];
        if (unit === '万') amount *= 10000;
        if (unit === '千') amount *= 1000;
        return Math.round(amount);
    }

    // 人数解析：支持 “两人/我们三个人/5人/俩人/一家四口”
    extractPeople(text) {
        // 一家N口
        const family = text.match(/一家([零一二三四五六七八九十两几0-9]+)口/);
        if (family) return this.parseChineseNumber(family[1]);
        const m = text.match(/([零一二三四五六七八九十两几0-9]+)\s*人/);
        if (m) {
            let n = this.parseChineseNumber(m[1]);
            if (m[1] === '几') n = 3; // 约数
            return n > 0 ? n : undefined;
        }
        return undefined;
    }

    // 显式日期范围：YYYY-MM-DD / YYYY年M月D日 / X月X日 到 X月X日 / 从X到Y
    extractDateRange(text) {
        // 标准日期
        const isoRange = text.match(/(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)[^\d]{0,3}(到|至|~|-|—|—|––|—\s*)(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)/);
        if (isoRange) {
            return {
                start: this.normalizeDate(isoRange[1]),
                end: this.normalizeDate(isoRange[3]),
                days: this.diffDays(this.normalizeDate(isoRange[1]), this.normalizeDate(isoRange[3]))
            };
        }
        // 同年省略年的范围： M月D日 到 M月D日
        const mdRange = text.match(/(\d{1,2})月(\d{1,2})日?\s*(到|至|到\s*|~|-)\s*(\d{1,2})月(\d{1,2})日?/);
        if (mdRange) {
            const y = new Date().getFullYear();
            const s = this.formatYMD(y, mdRange[1], mdRange[2]);
            const e = this.formatYMD(y, mdRange[4], mdRange[5]);
            return { start: s, end: e, days: this.diffDays(s, e) };
        }
        // 单个日期
        const singleISO = text.match(/(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}日?)/);
        if (singleISO) {
            return { start: this.normalizeDate(singleISO[1]) };
        }
        const singleMD = text.match(/(\d{1,2})月(\d{1,2})日?/);
        if (singleMD) {
            const y = new Date().getFullYear();
            return { start: this.formatYMD(y, singleMD[1], singleMD[2]) };
        }
        // 时长：N天/三天/5日
        const dur = text.match(/([零一二三四五六七八九十两0-9]+)\s*(天|日)/);
        const days = dur ? this.parseChineseNumber(dur[1]) : 0;
        return { start: '', end: '', days };
    }

    extractRelativeDates(text, now) {
        const add = (d) => this.formatDate(this.addDays(now, d));
        // 明天/后天/大后天
        if (/大后天/.test(text)) return { start: add(3), end: '' };
        if (/后天/.test(text)) return { start: add(2), end: '' };
        if (/明天|明日|翌日/.test(text)) return { start: add(1), end: '' };

        // 本周末/周末：取周六到周日
        if (/本周末|这周末|周末/.test(text)) {
            const day = now.getDay();
            const toSat = (6 - day + 7) % 7; // 到周六
            const start = this.addDays(now, toSat);
            const end = this.addDays(start, 1);
            return { start: this.formatDate(start), end: this.formatDate(end) };
        }

        // 下周X（周一~周日）
        const weekMap = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':0,'天':0 };
        const nw = text.match(/下周([一二三四五六日天])/);
        if (nw) {
            const target = weekMap[nw[1]];
            const day = now.getDay();
            const delta = ((7 - day) % 7) + target; // 到下周目标日
            const start = this.addDays(now, delta);
            return { start: this.formatDate(start), end: '' };
        }
        return { start: '', end: '' };
    }

    parseChineseNumber(token) {
        if (!token) return NaN;
        // 直接数字
        if (/^[0-9\.]+$/.test(token)) return parseFloat(token);
        const map = { '零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000 };
        let total = 0, unit = 1, num = 0;
        for (let i = token.length - 1; i >= 0; i--) {
            const ch = token[i];
            const val = map[ch];
            if (val == null) continue;
            if (val >= 10) {
                if (val > unit) unit = val; else unit *= val;
            } else {
                num += val * unit;
            }
        }
        total += num;
        if (total === 0 && (token === '十')) total = 10;
        return total || NaN;
    }

    diffDays(s, e) {
        try { return Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000)); } catch { return 0; }
    }
    addDays(date, n) {
        const d = new Date(date);
        d.setDate(d.getDate() + n);
        return d;
    }
    formatDate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${dd}`;
    }
    formatYMD(y, m, d) {
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
    normalizeDate(s) {
        // 支持 2025/1/5、2025-1-5、2025年1月5日
        const m = s.match(/(\d{4})[\-/年](\d{1,2})[\-/月](\d{1,2})/);
        if (m) return this.formatYMD(m[1], m[2], m[3]);
        return s;
    }

    extractPreferences(text) {
        const dict = ['美食','亲子','徒步','登山','露营','自驾','购物','博物馆','艺术','海滩','潜水','滑雪','文化','夜生活','摄影','小众','轻松','网红','历史','古镇','温泉'];
        const found = [];
        dict.forEach(k => { if (text.includes(k)) found.push(k); });
        // 关键词短语
        if (/慢节奏|休闲|放松/.test(text)) found.push('轻松');
        if (/人少|小众/.test(text)) found.push('小众');
        return Array.from(new Set(found));
    }

    showAddExpenseModal() {
        // 实现添加费用模态框
        this.showMessage('添加费用功能开发中...', 'success');
    }

    viewPlan(planId) {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }
        this.fetchAndShowPlanDetail(planId);
    }

    editPlan(planId) {
        this.showMessage('编辑行程功能开发中...', 'success');
    }

    deletePlan(planId) {
        if (confirm('确定要删除这个行程吗？')) {
            this.showMessage('删除行程功能开发中...', 'success');
        }
    }

    async fetchAndShowPlanDetail(planId) {
        try {
            const res = await this.apiCall(`/travel/plans/${planId}`, 'GET');
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                this.showMessage(err.error || '获取行程详情失败', 'error');
                return;
            }
            const data = await res.json();
            this.renderPlanDetailModal(data);
        } catch (e) {
            this.showMessage('网络错误，请重试', 'error');
        }
    }

    renderPlanDetailModal(data) {
        const plan = data.plan || {};
        const days = data.days || [];
        const actsByDay = data.activities_by_day || {};

        const dayBlocks = days.map((d, idx) => {
            const acts = actsByDay[d.id] || [];
            const actsHtml = acts.length
                ? acts.map(a => `
                    <li>
                        <strong>${a.title || a.type || '活动'}</strong>
                        ${a.location ? ` - ${a.location}` : ''}
                        ${a.cost ? ` - ¥${a.cost}` : ''}
                        ${a.description ? `<div class="muted">${a.description}</div>` : ''}
                    </li>
                `).join('')
                : '<li class="muted">暂无活动</li>';

            return `
                <div class="plan-day">
                    <h4>第 ${d.day_number || (idx+1)} 天 ${d.date ? `（${new Date(d.date).toLocaleDateString()}）` : ''}</h4>
                    <ul class="plan-activities">${actsHtml}</ul>
                </div>
            `;
        }).join('');

        const html = `
            <div class="plan-detail">
                <h3>${plan.title || '行程详情'}</h3>
                <p><strong>目的地：</strong>${plan.destination || '-'}</p>
                <p><strong>日期：</strong>${plan.start_date || '-'} 至 ${plan.end_date || '-'}</p>
                <p><strong>预算：</strong>${plan.budget != null ? '¥' + plan.budget : '-'}</p>
                <p><strong>人数：</strong>${plan.people || '-'}</p>
                <div class="plan-days">
                    ${dayBlocks || '<p class="muted">暂无行程日程</p>'}
                </div>
            </div>
        `;

        const modal = document.getElementById('modal');
        const body = document.getElementById('modalBody');
        body.innerHTML = html;
        modal.style.display = 'block';
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // 自动附带OpenAI配置到请求头，便于后端兜底获取
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.openaiApiKey) {
                options.headers['X-OpenAI-API-Key'] = settings.openaiApiKey;
            }
            if (settings.openaiBaseUrl) {
                options.headers['X-OpenAI-Base-URL'] = settings.openaiBaseUrl;
            }
            if (settings.openaiModel) {
                options.headers['X-OpenAI-Model'] = settings.openaiModel;
            }
        } catch (e) {}

        if (data) {
            options.body = JSON.stringify(data);
        }

        return fetch(`${this.apiBase}${endpoint}`, options);
    }

    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    showLoading(button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> 处理中...';
    }

    hideLoading(button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-magic"></i> 生成AI行程';
    }

    // 清除字段错误状态
    clearFieldErrors() {
        const fields = ['destination', 'startDate', 'endDate', 'budget', 'people'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('error');
            }
        });
    }

    // 高亮错误字段
    highlightErrorFields(errorFields) {
        errorFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('error');
                field.focus();
            }
        });
    }

    // 切换个人中心标签页
    switchProfileTab(tab) {
        // 更新标签按钮状态
        document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.profile-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        if (tab === 'info') {
            document.getElementById('profileInfoTab').classList.add('active');
        } else if (tab === 'settings') {
            document.getElementById('profileSettingsTab').classList.add('active');
        }
    }

    // 加载设置
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            if (settings.openaiApiKey) {
                document.getElementById('openaiApiKey').value = settings.openaiApiKey;
            }
            if (settings.openaiBaseUrl) {
                document.getElementById('openaiBaseUrl').value = settings.openaiBaseUrl;
            }
            if (settings.openaiModel) {
                const modelInput = document.getElementById('openaiModel');
                if (modelInput) modelInput.value = settings.openaiModel;
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    // 保存设置
    async saveSettings() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        const baseUrl = document.getElementById('openaiBaseUrl').value.trim() || 'https://api.openai.com/v1';
        const model = (document.getElementById('openaiModel')?.value || '').trim();

        if (!apiKey) {
            this.showApiKeyStatus('请输入OpenAI API Key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showApiKeyStatus('API Key格式不正确，应以sk-开头', 'error');
            return;
        }

        try {
            // 保存到localStorage
            const settings = {
                openaiApiKey: apiKey,
                openaiBaseUrl: baseUrl,
                openaiModel: model,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('userSettings', JSON.stringify(settings));

            // 如果已登录，也保存到后端
            if (this.token) {
                try {
                    await this.apiCall('/settings', 'PUT', {
                        openai_api_key: apiKey,
                        openai_base_url: baseUrl,
                        openai_model: model
                    });
                } catch (error) {
                    console.warn('保存到后端失败，已保存到本地:', error);
                }
            }

            this.showApiKeyStatus('设置已保存成功！', 'success');
            
            // 更新LLM服务配置（如果服务支持动态更新）
            this.updateLLMConfig(apiKey, baseUrl);
        } catch (error) {
            this.showApiKeyStatus('保存设置失败: ' + error.message, 'error');
        }
    }

    // 测试API Key
    async testApiKey() {
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        const baseUrl = document.getElementById('openaiBaseUrl').value.trim() || 'https://api.openai.com/v1';

        if (!apiKey) {
            this.showApiKeyStatus('请先输入OpenAI API Key', 'error');
            return;
        }

        this.showApiKeyStatus('正在测试连接...', 'info');
        document.getElementById('testApiKeyBtn').disabled = true;

        try {
            // 调用后端测试接口
            const response = await fetch(`${this.apiBase}/settings/test-api-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token ? `Bearer ${this.token}` : ''
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    base_url: baseUrl
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showApiKeyStatus('✓ API Key验证成功！连接正常', 'success');
            } else {
                this.showApiKeyStatus('✗ 验证失败: ' + (data.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.showApiKeyStatus('✗ 测试失败: ' + error.message, 'error');
        } finally {
            document.getElementById('testApiKeyBtn').disabled = false;
        }
    }

    // 显示API Key状态
    showApiKeyStatus(message, type) {
        const statusDiv = document.getElementById('apiKeyStatus');
        statusDiv.textContent = message;
        statusDiv.className = `api-key-status ${type} show`;
        
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 5000);
    }

    // 更新LLM配置（用于后续API调用）
    updateLLMConfig(apiKey, baseUrl) {
        // 将配置存储，供后续API调用使用
        this.llmConfig = {
            apiKey: apiKey,
            baseUrl: baseUrl
        };
    }

    // 获取用户配置的API Key（优先使用用户配置）
    getUserApiKey() {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            return settings.openaiApiKey || null;
        } catch (error) {
            return null;
        }
    }
}

// 初始化应用
const app = new TravelPlannerApp();
