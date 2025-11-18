<template>
    <div class="container">
        <div class="disclaimer-container">
            <button @click="showDisclaimer" class="disclaimer-btn">⚠️ 免责声明</button>
        </div>
        <!-- 左侧登录面板 -->
        <div class="left-panel">
            <div class="logo">
                <h1>HEY<span>TEA</span></h1>
            </div>
            <h2>用户登录</h2>

            <div class="login-method">
                <label>
                    <input type="radio" v-model="loginMethod" value="phone"> 手机号登录
                </label>
                <label>
                    <input type="radio" v-model="loginMethod" value="token"> Token登录
                </label>
            </div>

            <div class="login-form" v-if="loginMethod === 'phone'">
                <div class="form-group">
                    <label for="phone">手机号:</label>
                    <input type="tel" id="phone" v-model="phone" placeholder="请输入手机号">
                </div>

                <div class="form-group">
                    <label for="verificationCode">验证码:</label>
                    <input type="number" id="verificationCode" v-model="verificationCode" placeholder="请输入验证码"
                        :disabled="!verificationCodeEnabled">
                </div>

                <div class="button-group">
                    <button @click="getVerificationCode" :disabled="getVerificationCodeDisabled">{{
                        getVerificationCodeText }}</button>
                    <button @click="phoneLogin" class="secondary-btn" :disabled="loginDisabled">登录</button>
                </div>
            </div>

            <div class="login-form" v-if="loginMethod === 'token'">
                <div class="form-group">
                    <label for="token">Token:</label>
                    <textarea id="token" v-model="token" placeholder="请输入您的Token" rows="9"></textarea>
                </div>

                <div class="button-group">
                    <button @click="tokenLogin" class="secondary-btn">登录</button>
                </div>
            </div>
            <div class="login-help" v-if="!isLoggedIn">
                <p class="help-text">
                    如果获取验证码失败，请下载喜茶APP获取验证码。获取后不要在APP中填写验证码，直接将验证码填在此处后点击登录<br></br>
                    如果提示注册行为异常，请先下载喜茶APP，在手机上完成一次登录后再试</p>
            </div>

            <div v-if="loginStatus.message" :class="['status', loginStatus.type]">{{ loginStatus.message }}</div>

            <!-- 用户信息显示区域 -->
            <div v-if="isLoggedIn" class="user-info">
                <h3>用户信息</h3>
                <div class="user-info-item">
                    <span class="user-info-label">用户名:</span>
                    <span class="user-info-value">{{ userData.name }}</span>
                </div>
                <div class="user-info-item">
                    <span class="user-info-label">手机号:</span>
                    <span class="user-info-value">{{ showSensitiveInfo ? userData.phone : maskedPhone }}</span>
                    <span class="toggle-visibility" @click="toggleSensitiveInfo">
                        {{ showSensitiveInfo ? '👁️' : '🙈' }}
                    </span>
                </div>
                <div class="user-info-item">
                    <span class="user-info-label">用户ID:</span>
                    <span class="user-info-value">{{ showSensitiveInfo ? userData.id : maskedUserId }}</span>
                    <span class="toggle-visibility" @click="toggleSensitiveInfo">
                        {{ showSensitiveInfo ? '👁️' : '🙈' }}
                    </span>
                </div>
                <div class="user-info-item">
                    <span class="user-info-label">Token:</span>
                    <span class="user-info-value token-display">{{ userData.token }}</span>
                </div>
                <div class="button-group">
                    <button @click="logout" class="logout-btn">退出登录</button>
                </div>
            </div>
        </div>

        <!-- 右侧图片上传面板 -->
        <div class="right-panel">
            <h2>图片上传与裁剪</h2>
            <div id="uploadSection">
                <div v-if="!showCropper && !showPreview && !hasUploaded" class="upload-area"
                    @click="$refs.fileInput.click()" @dragover.prevent="dragover = true"
                    @dragleave.prevent="dragover = false" @drop.prevent="handleDrop"
                    :style="{ borderColor: dragover ? '#667eea' : '#e1e5e9', backgroundColor: dragover ? '#f0f4ff' : '#fafafa' }">
                    <div class="upload-icon">📁</div>
                    <p>点击选择图片或拖拽图片到此处</p>
                    <p>支持 JPG, PNG格式</p>
                    <p class="dimensions-info">目标尺寸: 596 × 832 像素</p>
                    <input type="file" ref="fileInput" accept="image/*" style="display: none"
                        @change="handleFileSelect">
                </div>

                <!-- 裁剪工具：使用 cropperjs -->
                <div v-if="showCropper" class="cropper-wrapper">
                    <div class="cropper-container-body">
                        <img ref="cropperImage" :src="currentImageSrc" alt="待裁剪图片" />
                    </div>

                    <div class="crop-controls">
                        <button @click="cancelCrop" class="crop-btn secondary-btn">重新选择</button>
                        <button @click="confirmCrop" class="crop-btn primary-btn">确认裁剪</button>
                    </div>
                </div>

                <div v-if="showPreview" class="preview-wrapper">
                    <canvas ref="previewCanvas" width="596" height="832" class="preview-canvas"></canvas>

                    <div class="crop-controls" style="margin-top: 35px;">
                        <button @click="cancelCrop" class="crop-btn secondary-btn">重新选择</button>
                        <button @click="reCrop" class="crop-btn primary-btn">重新裁剪</button>
                    </div>
                </div>

                <div v-if="showCropControls" class="crop-controls">
                    <button @click="removeBg" class="crop-btn remove-bg-btn" :disabled="removeBgDisabled">
                        {{ removeBgText }}</button>
                    <button @click="applyGrayscale" class="crop-btn grayscale-btn" :disabled="grayscaleDisabled">
                        {{ grayscaleText }}</button>
                    <button @click="applySketch" class="crop-btn sketch-btn" :disabled="sketchDisabled">
                        {{ sketchText }}</button>
                    <button @click="applyPixelize" class="crop-btn pixelize-btn" :disabled="pixelizeDisabled">
                        {{ pixelizeText }}</button>
                    <button @click="applyContrast" class="crop-btn contrast-btn" :disabled="contrastDisabled">
                        {{ contrastText }}
                    </button>
                    <button @click="generatePrintPreview" class="crop-btn preview-btn" :disabled="printPreviewDisabled">
                        {{ printPreviewText }}
                    </button>
                    <button @click="showAdvancedOptions = !showAdvancedOptions" class="crop-btn more-btn">
                        {{ showAdvancedOptions ? '隐藏更多' : '更多处理' }}
                    </button>
                    <button @click="undoLastAction" class="crop-btn undo-btn" :disabled="undoDisabled">{{ undoButtonText
                    }}</button>

                </div>

                <!-- 更多处理选项（可折叠） -->
                <div v-if="showCropControls && showAdvancedOptions" class="advanced-controls">
                    <button @click="showDescribeModal = true" class="crop-btn describe-btn"
                        :disabled="describeButtonDisabled">{{
                            describeButtonText }}</button>
                    <button @click="applyGeometric" class="crop-btn geometric-btn" :disabled="geometricDisabled">{{
                        geometricText }}</button>
                    <button @click="applyParticle" class="crop-btn particle-btn" :disabled="particleDisabled">{{
                        particleText }}</button>
                    <button @click="applyLowPoly" class="crop-btn lowpoly-btn" :disabled="lowPolyDisabled">{{
                        lowPolyText }}</button>
                </div>
                <div v-if="uploadStatus.message" :class="['status', uploadStatus.type]">{{ uploadStatus.message }}</div>

                <div v-if="showImageInfo" class="image-info-card">
                    <h3>图片信息</h3>
                    <div class="image-info-grid">
                        <div class="image-info-item">
                            <strong>尺寸</strong>
                            <span>596 × 832 像素</span>
                        </div>
                        <div class="image-info-item">
                            <strong>大小</strong>
                            <span>{{ imageSizeKB }} KB</span>
                        </div>
                    </div>
                </div>

                <!-- 压缩按钮 -->
                <button v-if="showCompressBtn" @click="compressImage" class="crop-btn" :disabled="compressDisabled"
                    style="padding: 15px 30px; font-size: 16px; margin: 15px auto; display: block; min-width: 180px; background: linear-gradient(135deg, #4CAF50, #2E7D32);">{{
                        compressText }}</button>

                <div v-if="showUploadBtn" class="button-group"
                    style="justify-content: center; margin: 20px auto; max-width: 500px;">
                    <button @click="uploadImage" style="padding: 20px 40px; font-size: 18px; min-width: 150px;"
                        :disabled="uploadDisabled">{{ uploadText }}</button>
                    <button @click="saveImage"
                        style="padding: 20px 40px; font-size: 18px; min-width: 150px; background: linear-gradient(135deg, #2196F3, #0D47A1);"
                        :disabled="saveDisabled">{{ saveText }}</button>
                </div>

            </div>

        </div>
        <div v-if="showDisclaimerModal" class="modal-overlay" @click="closeDisclaimer">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>免责声明</h3>
                </div>
                <div class="modal-body">
                    <p>本软件仅供学习交流使用，不得用于任何非法用途。</p>
                    <p>请合理使用，禁止用于违法用途。</p>
                    <p>使用者应遵守相关法律法规，承担使用本软件产生的一切后果。</p>
                    <p>开发者不对因使用本软件而产生的任何损失或法律责任负责。</p>
                </div>
                <div class="modal-footer">
                    <button @click="closeDisclaimer" class="confirm-btn">我已知晓</button>
                </div>
            </div>
        </div>
        <!-- 文字描摹模态框 -->
        <div v-if="showDescribeModal" class="modal-overlay" @click="showDescribeModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>文字描摹</h3>
                </div>
                <div class="modal-body">
                    <p>请输入要描摹的文字，用顿号（、）或分号（；）分割词语：</p>
                    <textarea v-model="describeText" placeholder="例如：喜茶、新鲜、美味；高质量"
                        style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"></textarea>
                </div>
                <div class="modal-footer">
                    <button @click="applyTextDescribe" class="confirm-btn"
                        :disabled="isDescribing || !describeText.trim()">{{ isDescribing ? '处理中...' : '确定' }}</button>
                    <button @click="showDescribeModal = false" class="cancel-btn"
                        style="background: #999; margin-left: 10px;">取消</button>
                </div>
            </div>
        </div>
        <!-- 添加打印预览模态框 -->
        <div v-if="showPrintPreviewModal" class="modal-overlay print-preview-modal" @click="closePrintPreview">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>打印预览</h3>
                </div>
                <div class="modal-body">
                    <div class="preview-warning">
                        受喜茶打印机限制，颜色低于灰色的区域在实际打印中将显示为白色(不打印)，部分深色区域可能会缺失细节。可以使用增加对比度或波点效果处理，使用不同密度的黑白点，模拟视觉灰色。
                        <br></br>各门店打印机不同，提供打印预览图供参考，请根据预览效果调整图片，确保打印效果符合预期。
                    </div>
                    <div class="preview-container">
                        <img v-if="printPreviewUrl" :src="printPreviewUrl" class="preview-image" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="closePrintPreview" class="confirm-btn">关闭</button>
                </div>
            </div>
        </div>
        <div v-if="showIPTipsModal" class="modal-overlay" @click="closeIPTips">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>重要提示</h3>
                </div>
                <div class="modal-body">
                    <p>本项目旨在帮助不会画画的朋友，把喜欢的照片或图案也能贴到杯子上。</p>
                    <p>但目前喜茶方已封禁本站上传IP，本站也暂停在线上传功能。</p>
                    <p>大家仍然可以使用电脑自行本地部署本项目上传，操作教程见本项目地址: https://github.com/Ssoutnn/heytea-diy。</p>
                </div>
                <div class="modal-footer">
                    <button @click="closeIPTips" class="confirm-btn">确定</button>
                </div>
            </div>
        </div>
        <div v-if="showUploadSuccess" class="modal-overlay">
            <div class="upload-success-panel">
                <div class="success-content">
                    <div class="success-icon">✅</div>
                    <div class="success-text">
                        <h3>上传成功</h3>
                        <p>图片已成功上传，可前往喜茶小程序查看</p>
                    </div>
                </div>
                <div class="success-actions">
                    <button @click="closeUploadSuccess" class="primary-btn">确定</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import CryptoJS from 'crypto-js';
import axios from 'axios';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { removeBackground } from '@imgly/background-removal';

axios.defaults.timeout = 300000; // 设置全局请求超时时间为300秒
const BG_COLOR = '#ffffff';
const CROP_WIDTH = 596;
const CROP_HEIGHT = 832;
const IMAGE_PNG = 'image/png';
const UPLOAD_FILENAME = 'image.png';


//喜茶相关密钥部分暂不公开
const AES_KEY = "";
const AES_IV = "";
const SIGN_SALT = "";
const AES_INFO_KEY = "";
const ENCRYPTION_PREFIX = "";


export default {
    name: 'HeyteaUpload',
    data() {
        return {
            loginMethod: 'phone',
            phone: '',
            verificationCode: '',
            token: '',
            isLoggedIn: false,
            userData: {
                name: '',
                phone: '',
                id: '',
                token: ''
            },
            loginStatus: { message: '', type: '' },
            uploadStatus: { message: '', type: '' },
            showDisclaimerModal: false,
            showSensitiveInfo: false,
            showUploadSuccess: false,
            showIPTipsModal: false,

            // 获取验证码按钮状态
            getVerificationCodeDisabled: false,
            getVerificationCodeText: '获取验证码',
            verificationCodeEnabled: true,
            loginDisabled: false,

            // 图片处理相关
            currentImageSrc: null,
            cropperInstance: null,
            croppedBlob: null,
            dragover: false,

            // 裁剪工具状态
            showCropper: false,
            showPreview: false,
            showCropControls: false,
            showImageInfo: false,
            showCompressBtn: false,
            showUploadBtn: false,

            imageSizeKB: 0,
            compressInfo: '',
            removeBgDisabled: false,
            removeBgText: '去除背景',
            grayscaleDisabled: false,
            grayscaleText: '黑白效果',
            compressDisabled: false,
            compressText: '压缩图片',
            uploadDisabled: false,
            uploadText: '上传图片',
            saveDisabled: false,
            saveText: '保存图片',
            // 上传后隐藏上传区
            hasUploaded: false,
            printPreviewDisabled: false,
            printPreviewText: '打印预览',
            showPrintPreviewModal: false,
            printPreviewUrl: null,

            // 文字描摹相关
            showDescribeModal: false,
            describeText: '',
            isDescribing: false,
            describeButtonDisabled: false,
            describeButtonText: '文字描摹',

            // 撤销功能相关
            undoStack: [], // 存储每一步操作的原始 blob
            undoLabels: [], // 存储每一步操作的标签
            showUndoBtn: false,
            undoDisabled: true,
            undoButtonText: '撤销',

            // 简笔画效果相关
            sketchDisabled: false,
            sketchText: '简笔画',

            // 更多处理功能相关
            showAdvancedOptions: false,
            contrastDisabled: false,
            contrastText: '增加对比度',
            pixelizeDisabled: false,
            pixelizeText: '波点效果',
            geometricDisabled: false,
            geometricText: '几何分割',
            particleDisabled: false,
            particleText: '粒子化',
            lowPolyDisabled: false,
            lowPolyText: '低多边形',

            // 裁剪相关变量（只保留必要项）
            ASPECT_RATIO: CROP_WIDTH / CROP_HEIGHT,

            // 常量
            API_BASE_URL: '/express/api',
            UPLOAD_API_URL: '/express/upload'
        };
    },
    mounted() {
        // 页面加载时检查是否有保存的登录信息
        this.checkSavedLogin();
        this.showIPTipsModal = true;
    },
    beforeUnmount() {
        // 确保销毁 cropper 实例
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
            this.cropperInstance = null;
        }
    },
    computed: {
        // 计算属性：掩码手机号
        maskedPhone() {
            if (!this.userData?.phone) return '';
            const phone = this.userData.phone.toString();
            if (phone.length < 7) return phone; // 长度不足时不处理
            return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
        },

        // 计算属性：掩码用户ID
        maskedUserId() {
            if (!this.userData?.id) return '';
            const userId = this.userData.id.toString();
            if (userId.length < 7) return userId; // 长度不足时不处理
            return userId.substring(0, 3) + '****' + userId.substring(userId.length - 2);
        },
    },
    methods: {
        closeIPTips() {
            this.showIPTipsModal = false;
        },
        toggleSensitiveInfo() {
            this.showSensitiveInfo = !this.showSensitiveInfo;
        },
        showDisclaimer() {
            this.showDisclaimerModal = true;
        },

        closeDisclaimer() {
            this.showDisclaimerModal = false;
        },
        encryptPhone(phone) {
            const key = CryptoJS.enc.Utf8.parse(AES_KEY);
            const iv = CryptoJS.enc.Utf8.parse(AES_IV);

            const encrypted = CryptoJS.AES.encrypt(phone, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            return encrypted.toString();
        },

        async fetchData(url, config) {
            // 保持与原来接口兼容：将目标 url 放入请求体，转发到后端 /api
            let headers = {};
            // let headers = {
            //     Accept: "application/prs.heytea.v1+json",
            //     "Content-Type": "application/json",
            //     "x-client-version": "4.0.1",
            //     "client-version": "4.0.1",
            //     version: "4.0.1",
            //     "x-region-id": "10",
            //     region: "1",
            //     "x-client": "app",
            //     client: "2",
            //     "x-version": "4.0.1",
            //     "User-Agent": "Mozilla/5.0 (Linux; Android 16; 2410DPN6CC Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/86.0.4240.99 XWEB/4433 MMWEBSDK/20220904 Mobile Safari/537.36",
            // };
            config = config || {};
            config.url = url;
            config.headers = { ...headers, ...(config.headers || {}) };
            const res = await axios.post(this.API_BASE_URL, config);
            return res.data;
        },

        getVerificationCode() {
            if (!this.phone) {
                this.showStatus('loginStatus', '请输入手机号', 'error');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(this.phone)) {
                this.showStatus('loginStatus', '请输入正确的手机号', 'error');
                return;
            }

            const encryptedPhone = this.encryptPhone(this.phone);

            const requestBody = {
                cryptoLevel: 2,
                ticketFrom: 'min',
                brandId: '1000001',
                mobile: encryptedPhone,
                client: 'app',
                zone: '86'
            };

            this.fetchData(`/api/service-member/openapi/vip/user/sms/verifiyCode/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            })
                .then(data => {
                    if (data.code === 0) {
                        this.showStatus('loginStatus', '验证码已发送至您的手机', 'success');
                        this.getVerificationCodeDisabled = true;
                        this.verificationCodeEnabled = true;
                        this.loginDisabled = false;

                        let count = 60;
                        this.getVerificationCodeText = `${count}秒后重新获取`;

                        const timer = setInterval(() => {
                            count--;
                            this.getVerificationCodeText = `${count}秒后重新获取`;

                            if (count <= 0) {
                                clearInterval(timer);
                                this.getVerificationCodeText = '获取验证码';
                                this.getVerificationCodeDisabled = false;
                            }
                        }, 1000);
                    } else if (data.code === 4005021) {
                        this.showStatus('loginStatus', '获取验证码失败, 请使用喜茶APP获取验证码后填入', 'error');
                    } else {
                        this.showStatus('loginStatus', data.message || '获取验证码失败', 'error');
                    }
                })
                .catch(error => {
                    this.showStatus('loginStatus', '网络错误，请稍后重试', 'error');
                    console.error('获取验证码错误:', error);
                });
        },
        phoneLogin() {
            if (!this.phone) {
                this.showStatus('loginStatus', '请输入手机号', 'error');
                return;
            }
            if (!this.verificationCode) {
                this.showStatus('loginStatus', '请输入验证码', 'error');
                return;
            }
            const encryptedPhone = this.encryptPhone(this.phone);

            const requestBody = {
                "client": "app",
                "channel": "A",
                "phone": encryptedPhone,
                "zone": "86",
                "cryptoLevel": 2,
                "smsCode": this.verificationCode,
                "email": null,
                "brand": "1000001",
                "ticketFrom": "min",
                "loginType": "APP_CODE"
            };
            this.fetchData(`/api/service-login/openapi/vip/user/login_v1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody
            })
                .then(data => {
                    if (data.code === 0) {
                        const userData = data.data;
                        this.loginSuccess({
                            name: userData.nickName || '',
                            phone: this.phone || '',
                            id: userData['userMainId'] || '',
                            token: userData.token || ''
                        });
                    } else {
                        let msg = data.message;
                        if(msg.contains('验证码已过期')){
                            msg = msg + '或已被喜茶风控';
                        }
                        this.showStatus('loginStatus', msg || '登录失败', 'error');
                    }
                })
                .catch(error => {
                    this.showStatus('loginStatus', '网络错误，请稍后重试', 'error');
                    console.error('手机号登录错误:', error);
                });

        },
        decryptResponseData(payload) {
            if (typeof payload !== "string" || !payload.startsWith(ENCRYPTION_PREFIX)) {
                return payload;
            }
            const base64Body = payload.slice(ENCRYPTION_PREFIX.length);
            const encrypted = CryptoJS.enc.Base64.parse(base64Body);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: encrypted }, CryptoJS.enc.Utf8.parse(AES_INFO_KEY), {
                iv: CryptoJS.enc.Utf8.parse(AES_IV),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            const text = CryptoJS.enc.Utf8.stringify(decrypted);
            return JSON.parse(text);
        },
        tokenLogin() {
            if (!this.token) {
                this.showStatus('loginStatus', '请输入Token', 'error');
                return;
            }
            let token = this.token.trim();
            if (token.startsWith('Bearer ')) {
                token = token.slice(7).trim();
            }
            this.fetchData(`/api/service-member/vip/user/info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(data => {
                    if (data.code === 0) {
                        data = this.decryptResponseData(data.data);
                        const userData = data;
                        this.loginSuccess({
                            name: userData.name || '',
                            phone: userData.phone || '',
                            id: userData.user_main_id || '',
                            token: token || ''
                        });
                    } else {
                        this.showStatus('loginStatus', data.message || 'Token无效', 'error');
                    }
                })
                .catch(error => {
                    this.showStatus('loginStatus', '网络错误，请稍后重试', 'error');
                    console.error('Token验证错误:', error);
                });
        },

        loginSuccess(userData) {
            this.isLoggedIn = true;
            this.userData = userData;
            this.showStatus('loginStatus', '登录成功', 'success');

            this.setCookie('userName', userData.name, 30);
            this.setCookie('userPhone', userData.phone, 30);
            this.setCookie('userId', userData.id, 30);
            this.setCookie('userToken', userData.token, 30);
        },

        logout() {
            this.isLoggedIn = false;
            this.userData = { name: '', phone: '', id: '', token: '' };

            this.setCookie('userName', '', -1);
            this.setCookie('userPhone', '', -1);
            this.setCookie('userId', '', -1);
            this.setCookie('userToken', '', -1);

            // 重置表单
            this.phone = '';
            this.verificationCode = '';
            this.token = '';
            this.verificationCodeEnabled = true;
            this.loginDisabled = false;
            this.getVerificationCodeDisabled = false;
            this.getVerificationCodeText = '获取验证码';

            this.resetUploadInterface();
            this.showStatus('loginStatus', '已退出登录', 'success');
        },

        handleFileSelect(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImageForCropping(file);
            }
        },

        handleDrop(e) {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImageForCropping(file);
            }
            this.dragover = false;
        },

        loadImageForCropping(file) {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const dataUrl = e.target.result;

                // 把原图绘制到一个更大的 canvas 上，图片居中按比例缩放
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('图片加载失败'));
                });

                // 以图片自然尺寸为基础，但至少为 MIN，且不超过 MAX
                let canvasW = 800;
                let canvasH = 1100;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvasW;
                tempCanvas.height = canvasH;
                const ctx = tempCanvas.getContext('2d');

                // 背景填充
                ctx.fillStyle = BG_COLOR;
                ctx.fillRect(0, 0, canvasW, canvasH);

                // 计算图片缩放以适应画布，留一定内边距
                const padding = 80;
                const maxImgW = canvasW - padding * 2;
                const maxImgH = canvasH - padding * 2;
                // 允许对很小的图片适度放大，保证留有一点边界，但不要无限放大
                let scale = Math.min(maxImgW / img.width, maxImgH / img.height);
                const drawW = Math.round(img.width * scale);
                const drawH = Math.round(img.height * scale);
                const drawX = Math.round((canvasW - drawW) / 2);
                const drawY = Math.round((canvasH - drawH) / 2);

                ctx.drawImage(img, drawX, drawY, drawW, drawH);

                // 使用合成的画布作为 cropper 的图片源，保证背景一致且尺寸可控
                this.currentImageSrc = tempCanvas.toDataURL(IMAGE_PNG);

                // 设置显示状态并初始化裁剪器
                this.showCropper = true;
                this.showPreview = false;
                this.showCropControls = false;
                this.showImageInfo = false;
                this.showCompressBtn = false;
                this.showUploadBtn = false;

                this.$nextTick(() => {
                    const imgEl = this.$refs.cropperImage;
                    if (!imgEl) {
                        console.warn('cropperImage ref not found');
                        return;
                    }
                    if (!imgEl.complete) {
                        imgEl.onload = () => this.initCropper();
                    } else {
                        this.initCropper();
                    }
                });
            };
            reader.readAsDataURL(file);
        },

        initCropper() {
            try {
                if (this.cropperInstance) {
                    this.cropperInstance.destroy();
                    this.cropperInstance = null;
                }

                const imgEl = this.$refs.cropperImage;
                if (!imgEl) return;

                const minCropBoxW = 60; // 最小裁剪宽度（px）
                const minCropBoxH = Math.round(minCropBoxW / this.ASPECT_RATIO);

                const opts = {
                    aspectRatio: this.ASPECT_RATIO,
                    viewMode: 1,
                    autoCropArea: 0.6,
                    responsive: true,
                    background: false,
                    // 锁定背景图像：禁止平移/缩放图像本身，用户可以移动/调整裁剪框
                    movable: false,
                    zoomable: false,
                    zoomOnWheel: false,
                    zoomOnTouch: false,
                    toggleDragModeOnDblclick: false,
                    dragMode: 'crop',
                    rotatable: false,
                    scalable: false,
                    cropBoxResizable: true,
                    cropBoxMovable: true,
                    minContainerWidth: 250,
                    minContainerHeight: 350,
                    minCropBoxWidth: minCropBoxW,
                    minCropBoxHeight: minCropBoxH,
                    ready: () => {
                        this.showCropControls = false;
                    }
                };

                this.cropperInstance = new Cropper(imgEl, opts);
            } catch (err) {
                console.error('initCropper error', err);
            }
        },

        destroyCropper() {
            if (this.cropperInstance) {
                try {
                    this.cropperInstance.destroy();
                } catch (e) {
                    console.warn('destroy cropper warning', e);
                }
                this.cropperInstance = null;
            }
        },
        async reCrop() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可重新裁剪的图片', 'error');
                return;
            }

            try {
                // 将当前状态入栈以便撤销
                this.undoStack.push(this.croppedBlob);
                this.undoLabels.push('重新裁剪');
                this.showUndoBtn = true;
                this.undoDisabled = false;

                // 将当前裁剪的图片转换为 DataURL
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;

                    // 创建一个带边距的画布
                    const img = new Image();
                    img.onload = () => {
                        // 设置画布尺寸，四周留出至少60px边距
                        const canvasW = img.width + 120; // 左右各60px
                        const canvasH = img.height + 120; // 上下各60px

                        const marginCanvas = document.createElement('canvas');
                        marginCanvas.width = canvasW;
                        marginCanvas.height = canvasH;
                        const ctx = marginCanvas.getContext('2d');

                        // 填充背景色
                        ctx.fillStyle = BG_COLOR;
                        ctx.fillRect(0, 0, canvasW, canvasH);

                        // 在中心绘制原图
                        const drawX = 60;
                        const drawY = 60;
                        ctx.drawImage(img, drawX, drawY, img.width, img.height);

                        // 将带边距的图像作为新的裁剪源
                        this.currentImageSrc = marginCanvas.toDataURL('image/png');

                        // 设置显示状态并初始化裁剪器
                        this.showPreview = false;
                        this.showCropper = true;

                        this.$nextTick(() => {
                            const imgEl = this.$refs.cropperImage;
                            if (!imgEl) {
                                console.warn('cropperImage ref not found');
                                return;
                            }
                            if (!imgEl.complete) {
                                imgEl.onload = () => this.initCropper();
                            } else {
                                this.initCropper();
                            }
                        });
                    };
                    img.src = dataUrl;
                };
                reader.readAsDataURL(this.croppedBlob);
            } catch (error) {
                console.error('重新裁剪准备失败:', error);
                this.showStatus('uploadStatus', '重新裁剪准备失败', 'error');
            }
        },

        async confirmCrop() {
            if (!this.cropperInstance) {
                this.showStatus('uploadStatus', '裁剪器未准备好', 'error');
                return;
            }

            try {
                const canvas = this.cropperInstance.getCroppedCanvas({ width: CROP_WIDTH, height: CROP_HEIGHT, fillColor: BG_COLOR });
                if (!canvas) {
                    this.showStatus('uploadStatus', '无法获得裁剪结果', 'error');
                    return;
                }

                this.showCropper = false;
                this.showPreview = true;

                // 更新预览并生成 blob
                this.$nextTick(() => {
                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.fillStyle = BG_COLOR;
                    previewCtx.drawImage(canvas, 0, 0);

                    canvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        const sizeKB = Math.round(blob.size / 1024);
                        this.imageSizeKB = sizeKB;
                        this.showImageInfo = true;
                        this.showCropControls = true;
                        this.showUploadBtn = true;

                        // 撤销栈
                        let undoStack = this.undoStack || [];
                        if (undoStack.length == 0) {
                            undoStack.push(blob);
                            this.undoStack = undoStack;
                            let undoLabels = this.undoLabels || [];
                            undoLabels.push('原始裁剪');
                            this.undoLabels = undoLabels;
                            this.showUndoBtn = false;
                            this.undoDisabled = true;
                        }


                        if (sizeKB > 180) {
                            this.showCompressBtn = true;
                        } else {
                            this.showCompressBtn = false;
                        }

                        this.showStatus('uploadStatus', '图片裁剪完成，可以上传', 'success');
                    }, IMAGE_PNG, 0.9);
                });

                // 销毁 cropper，释放内存（保留 currentImageSrc 以便用户重新裁剪时使用）
                this.destroyCropper();
            } catch (error) {
                console.error('confirmCrop error', error);
                this.showStatus('uploadStatus', '裁剪出错，请重试', 'error');
            }
        },

        cancelCrop() {
            this.resetUploadInterface();
        },
        preprocessImage(blob) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    // 创建canvas进行预处理
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    // 绘制原图
                    ctx.drawImage(img, 0, 0);
                    // 获取图像数据
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // 将白色背景转为透明
                    for (let i = 0; i < data.length; i += 4) {
                        // 检查是否接近白色 (RGB值都大于250)
                        if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) {
                            // 设置alpha通道为0(完全透明)
                            data[i + 3] = 0;
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                    canvas.toBlob(resolve, IMAGE_PNG, 1.0);
                    URL.revokeObjectURL(url);
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('图片加载失败'));
                };

                img.src = url;
            });
        },

        async removeBg() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.removeBgDisabled = true;
            this.removeBgText = '本地处理中...';
            this.showStatus('uploadStatus', '加载 AI 模型中（首次加载约 5-10MB）...', 'info');

            try {
                // 预处理：将白色背景变透明
                this.showStatus('uploadStatus', '正在预处理图像...', 'info');
                const preprocessedBlob = await this.preprocessImage(this.croppedBlob);

                this.showStatus('uploadStatus', '正在智能分割前景与背景...', 'info');

                // removeBackground 接收 Blob 或 File，返回处理后的 Blob
                const resultBlob = await removeBackground(this.croppedBlob);

                // 将处理结果转换为图像数据用于预览
                const resultImg = new Image();
                resultImg.src = URL.createObjectURL(resultBlob);
                await new Promise((resolve, reject) => {
                    resultImg.onload = resolve;
                    resultImg.onerror = () => reject(new Error('结果图片加载失败'));
                });

                const previewCanvas = this.$refs.previewCanvas;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.fillStyle = BG_COLOR;
                previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                // 计算缩放后的尺寸以居中显示
                const scale = Math.min(CROP_WIDTH / resultImg.width, CROP_HEIGHT / resultImg.height);
                const scaledWidth = resultImg.width * scale;
                const scaledHeight = resultImg.height * scale;
                const x = (CROP_WIDTH - scaledWidth) / 2;
                const y = (CROP_HEIGHT - scaledHeight) / 2;

                previewCtx.drawImage(resultImg, x, y, scaledWidth, scaledHeight);

                // 添加到撤销栈
                this.undoStack.push(this.croppedBlob);
                this.undoLabels.push('去除背景');

                // 更新 croppedBlob 为处理后的结果
                this.croppedBlob = resultBlob;
                this.imageSizeKB = Math.round(resultBlob.size / 1024);

                // 显示撤销按钮
                this.showUndoBtn = true;
                this.undoDisabled = false;

                this.showStatus('uploadStatus', '背景去除成功（本地 AI 处理）', 'success');
                this.removeBgDisabled = false;
                this.removeBgText = '去除背景';

            } catch (error) {
                this.showStatus('uploadStatus', `处理失败：${error.message}`, 'error');
                this.removeBgDisabled = false;
                this.removeBgText = '去除背景';
                console.error('背景去除错误:', error);
            }
        },


        applySketch() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.sketchDisabled = true;
            this.sketchText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    // 把当前状态入栈以便撤销
                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('简笔画');

                    // 创建新的画布用于绘制简笔画
                    const sketchCanvas = document.createElement('canvas');
                    sketchCanvas.width = CROP_WIDTH;
                    sketchCanvas.height = CROP_HEIGHT;
                    const sketchCtx = sketchCanvas.getContext('2d');

                    // 填充背景
                    sketchCtx.fillStyle = BG_COLOR;
                    sketchCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 获取图像数据
                    const canvas = document.createElement('canvas');
                    canvas.width = CROP_WIDTH;
                    canvas.height = CROP_HEIGHT;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 简笔画算法 - Canny边缘检测简化版
                    const width = CROP_WIDTH;
                    const height = CROP_HEIGHT;
                    const gray = new Uint8Array(width * height);

                    // 转换为灰度图
                    for (let i = 0; i < data.length; i += 4) {
                        const idx = i / 4;
                        gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    }

                    // Sobel边缘检测
                    const edges = new Uint8Array(width * height);
                    const threshold = 30; // 降低阈值以检测更多边缘

                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const idx = y * width + x;

                            // Sobel算子
                            const gx = -gray[idx - width - 1] - 2 * gray[idx - 1] - gray[idx + width - 1]
                                + gray[idx - width + 1] + 2 * gray[idx + 1] + gray[idx + width + 1];
                            const gy = -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
                                + gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

                            const magnitude = Math.sqrt(gx * gx + gy * gy);
                            edges[idx] = magnitude > threshold ? 255 : 0;
                        }
                    }

                    // 绘制简笔画 - 实心线条，不使用混合模式
                    sketchCtx.strokeStyle = '#000000';
                    sketchCtx.lineWidth = 1.5;
                    sketchCtx.lineCap = 'round';
                    sketchCtx.lineJoin = 'round';

                    // 从上到下，从左到右扫描
                    for (let y = 0; y < height; y += 1) {
                        let isDrawing = false;

                        for (let x = 0; x < width; x++) {
                            const idx = y * width + x;
                            const isDarkPixel = data[idx] < 50 && data[idx + 1] < 50 && data[idx + 2] < 50; // 接近黑色的像素

                            if (edges[idx] === 255 && !isDarkPixel) {
                                if (!isDrawing) {
                                    sketchCtx.beginPath();
                                    sketchCtx.moveTo(x, y);
                                    isDrawing = true;
                                } else {
                                    sketchCtx.lineTo(x, y);
                                }
                            } else {
                                if (isDrawing) {
                                    sketchCtx.stroke();
                                    isDrawing = false;
                                }
                            }
                        }

                        if (isDrawing) {
                            sketchCtx.stroke();
                        }
                    }

                    // 垂直方向扫描以增强细节
                    for (let x = 0; x < width; x += 1) {
                        let isDrawing = false;

                        for (let y = 0; y < height; y++) {
                            const idx = y * width + x;
                            const isDarkPixel = data[idx] < 50 && data[idx + 1] < 50 && data[idx + 2] < 50; // 接近黑色的像素

                            if (edges[idx] === 255 && !isDarkPixel) {
                                if (!isDrawing) {
                                    sketchCtx.beginPath();
                                    sketchCtx.moveTo(x, y);
                                    isDrawing = true;
                                } else {
                                    sketchCtx.lineTo(x, y);
                                }
                            } else {
                                if (isDrawing) {
                                    sketchCtx.stroke();
                                    isDrawing = false;
                                }
                            }
                        }

                        if (isDrawing) {
                            sketchCtx.stroke();
                        }
                    }

                    // 更新预览 - 只绘制简笔画线条，不绘制原图
                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 直接绘制简笔画线条（不绘制原图）
                    previewCtx.drawImage(sketchCanvas, 0, 0);

                    sketchCanvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showUndoBtn = true;
                        this.undoDisabled = false;
                        this.showStatus('uploadStatus', '简笔画效果已应用', 'success');
                        this.sketchDisabled = false;
                        this.sketchText = '简笔画';
                    }, IMAGE_PNG, 0.95);
                } catch (err) {
                    console.error('简笔画错误:', err);
                    this.showStatus('uploadStatus', `简笔画失败：${err.message}`, 'error');
                    this.sketchDisabled = false;
                    this.sketchText = '简笔画';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.sketchDisabled = false;
                this.sketchText = '简笔画';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },
        applyGrayscale() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.grayscaleDisabled = true;
            this.grayscaleText = '处理中...';

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = CROP_WIDTH;
            tempCanvas.height = CROP_HEIGHT;

            const img = new Image();
            img.onload = () => {
                // 先填充背景
                tempCtx.fillStyle = BG_COLOR;
                tempCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                tempCtx.drawImage(img, 0, 0);

                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                tempCtx.putImageData(imageData, 0, 0);

                const previewCanvas = this.$refs.previewCanvas;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.fillStyle = BG_COLOR;
                previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.drawImage(tempCanvas, 0, 0);

                tempCanvas.toBlob((blob) => {
                    // 添加到撤销栈
                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('黑白效果');

                    this.croppedBlob = blob;
                    this.imageSizeKB = Math.round(blob.size / 1024);
                    // 显示撤销按钮
                    this.showUndoBtn = true;
                    this.undoDisabled = false;

                    this.showStatus('uploadStatus', '已转换为黑白效果', 'success');
                    this.grayscaleDisabled = false;
                    this.grayscaleText = '黑白效果';
                }, IMAGE_PNG);
            };
            img.src = URL.createObjectURL(this.croppedBlob);
        },

        async applyTextDescribe() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            if (!this.describeText || !this.describeText.trim()) {
                this.showStatus('uploadStatus', '请输入描摹文字（用顿号、分号或空格分隔）', 'error');
                return;
            }

            this.isDescribing = true;
            this.describeButtonDisabled = true;
            this.describeButtonText = '处理中...';

            try {
                // 使用顿号、分号或空格分割词汇
                const words = this.describeText.trim().split(/[、；;\s]+/).filter(Boolean);
                if (!words.length) {
                    this.showStatus('uploadStatus', '没有有效的词语', 'error');
                    this.isDescribing = false;
                    this.describeButtonDisabled = false;
                    this.describeButtonText = '文字描摹';
                    return;
                }

                const img = new Image();
                img.src = URL.createObjectURL(this.croppedBlob);

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // 创建画布并绘制原始图像
                const canvas = document.createElement('canvas');
                canvas.width = CROP_WIDTH;  // 596
                canvas.height = CROP_HEIGHT; // 832
                const ctx = canvas.getContext('2d');

                // 填充背景色
                ctx.fillStyle = BG_COLOR;
                ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                // 绘制原始图像
                ctx.drawImage(img, 0, 0, CROP_WIDTH, CROP_HEIGHT);

                // 获取图像数据
                const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                const data = imageData.data;

                // 创建输出画布
                const out = document.createElement('canvas');
                out.width = CROP_WIDTH;
                out.height = CROP_HEIGHT;
                const octx = out.getContext('2d');

                // 填充背景色
                octx.fillStyle = BG_COLOR;
                octx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                // 设置基础文字样式
                octx.textAlign = 'center';
                octx.textBaseline = 'middle';

                // 文字填充算法 - 稀疏分布，避免重叠
                const minFontSize = 6;    // 更小的字体
                const maxFontSize = 12;   // 更小的最大字体
                const spacing = 15;       // 更大的间距
                // 背景颜色阈值
                const bgThreshold = 250;

                // 存储已绘制文字的位置，避免重叠
                const placedTexts = [];

                // 按网格扫描图像，稀疏地放置文字
                for (let y = 20; y < CROP_HEIGHT - 20; y += spacing) {
                    for (let x = 20; x < CROP_WIDTH - 20; x += spacing) {
                        // 计算像素位置
                        const pixelX = Math.min(CROP_WIDTH - 1, x);
                        const pixelY = Math.min(CROP_HEIGHT - 1, y);
                        const idx = (pixelY * CROP_WIDTH + pixelX) * 4;

                        // 获取RGB值
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        // 检查是否为背景色
                        const isBackground = (r >= bgThreshold && g >= bgThreshold && b >= bgThreshold);

                        // 只在非背景区域放置文字，并且增加随机概率减少密度
                        if (!isBackground && Math.random() > 0.4) { // 只有60%的概率放置文字
                            // 计算亮度 (0-255)
                            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                            // 根据亮度确定字体大小（暗处文字更小，亮处文字稍大）
                            const fontSize = maxFontSize - Math.floor(brightness / 255 * (maxFontSize - minFontSize));

                            // 选择合适长度的文字（优先选择较短的词）
                            let word = '';
                            const shortWords = words.filter(w => w.length <= 4);
                            const mediumWords = words.filter(w => w.length > 4 && w.length <= 6);

                            if (shortWords.length > 0 && Math.random() > 0.3) {
                                // 70%概率选择短词
                                word = shortWords[Math.floor(Math.random() * shortWords.length)];
                            } else if (mediumWords.length > 0 && Math.random() > 0.5) {
                                // 50%概率选择中等长度词
                                word = mediumWords[Math.floor(Math.random() * mediumWords.length)];
                            } else {
                                // 其他情况随机选择
                                word = words[Math.floor(Math.random() * words.length)];
                            }

                            // 检查是否与已放置的文字重叠
                            const textWidth = octx.measureText(word).width * fontSize / 16;
                            const textHeight = fontSize;
                            let overlaps = false;

                            for (const placed of placedTexts) {
                                const distance = Math.sqrt(
                                    Math.pow(x - placed.x, 2) + Math.pow(y - placed.y, 2)
                                );
                                // 如果距离小于文字尺寸之和的一半，则认为重叠
                                if (distance < Math.max(textWidth, textHeight) / 2 +
                                    Math.max(placed.width, placed.height) / 2) {
                                    overlaps = true;
                                    break;
                                }
                            }

                            // 如果不重叠则绘制文字
                            if (!overlaps) {
                                // 小角度旋转以增加艺术效果
                                const rotation = (Math.random() * 20 - 10) * Math.PI / 180;

                                // 保存当前绘图状态
                                octx.save();

                                // 移动到文字中心位置
                                octx.translate(x, y);

                                // 旋转画布
                                octx.rotate(rotation);

                                // 设置字体和颜色
                                octx.font = `bold ${fontSize}px monospace`;
                                // 根据亮度调整文字颜色，确保对比度
                                const textColor = brightness < 128 ?
                                    `rgba(0, 0, 0, ${0.8 + (128 - brightness) / 1280})` :
                                    `rgba(102, 102, 102, ${0.8 + (255 - brightness) / 1280})`;
                                octx.fillStyle = textColor;

                                // 绘制文字
                                octx.fillText(word, 0, 0);

                                // 恢复绘图状态
                                octx.restore();

                                // 记录已放置的文字位置
                                placedTexts.push({
                                    x: x,
                                    y: y,
                                    width: textWidth,
                                    height: textHeight
                                });
                            }
                        }
                    }
                }

                // 预览结果
                const previewCanvas = this.$refs.previewCanvas;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.fillStyle = BG_COLOR;
                previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.drawImage(out, 0, 0);

                // 保存输出
                this.undoStack.push(this.croppedBlob);
                this.undoLabels.push('文字描摹');

                out.toBlob((blob) => {
                    this.croppedBlob = blob;
                    this.imageSizeKB = Math.round(blob.size / 1024);
                    this.isDescribing = false;
                    this.describeButtonDisabled = false;
                    this.describeButtonText = '文字描摹';
                    this.showDescribeModal = false;
                    this.showUndoBtn = true;
                    this.undoDisabled = false;
                    this.showStatus('uploadStatus', `已生成文字描摹艺术`, 'success');
                }, IMAGE_PNG, 1.0);
            } catch (err) {
                console.error('文字描摹错误:', err);
                this.showStatus('uploadStatus', `文字描摹失败：${err.message}`, 'error');
                this.isDescribing = false;
                this.describeButtonDisabled = false;
                this.describeButtonText = '文字描摹';
            }
        },
        applyContrast() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.contrastDisabled = true;
            this.contrastText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    // 把当前状态入栈以便撤销
                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('对比度调整');
                    this.showUndoBtn = true;
                    this.undoDisabled = false;

                    // 创建画布用于对比度调整
                    const contrastCanvas = document.createElement('canvas');
                    contrastCanvas.width = CROP_WIDTH;
                    contrastCanvas.height = CROP_HEIGHT;
                    const contrastCtx = contrastCanvas.getContext('2d');

                    // 填充背景
                    contrastCtx.fillStyle = BG_COLOR;
                    contrastCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 绘制图像
                    contrastCtx.drawImage(img, 0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 获取图像数据
                    const imageData = contrastCtx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 调整对比度的参数 (1.0 为原始对比度，>1.0 增加对比度，<1.0 降低对比度)
                    const contrastFactor = 1.2; // 增加20%对比度
                    const intercept = 128 * (1 - contrastFactor);

                    // 应用对比度调整算法
                    for (let i = 0; i < data.length; i += 4) {
                        // 对 RGB 三个通道分别应用对比度调整
                        data[i] = data[i] * contrastFactor + intercept;     // R
                        data[i + 1] = data[i + 1] * contrastFactor + intercept; // G
                        data[i + 2] = data[i + 2] * contrastFactor + intercept; // B
                        // 保留 alpha 通道不变
                    }

                    // 将处理后的数据放回画布
                    contrastCtx.putImageData(imageData, 0, 0);

                    // 更新预览
                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.drawImage(contrastCanvas, 0, 0);

                    // 保存处理后的图像
                    contrastCanvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showStatus('uploadStatus', '对比度调整完成', 'success');
                        this.contrastDisabled = false;
                        this.contrastText = '增加对比度';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('对比度调整错误:', error);
                    this.showStatus('uploadStatus', `对比度调整失败：${error.message}`, 'error');
                    this.contrastDisabled = false;
                    this.contrastText = '增加对比度';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.contrastDisabled = false;
                this.contrastText = '增加对比度';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },
        applyPixelize() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.pixelizeDisabled = true;
            this.pixelizeText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = CROP_WIDTH;
                    canvas.height = CROP_HEIGHT;
                    const ctx = canvas.getContext('2d');

                    // 填充背景色
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 绘制原图
                    ctx.drawImage(img, 0, 0);

                    // 获取整个图像的数据
                    const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 创建新的画布用于绘制点阵
                    const dotCanvas = document.createElement('canvas');
                    dotCanvas.width = CROP_WIDTH;
                    dotCanvas.height = CROP_HEIGHT;
                    const dotCtx = dotCanvas.getContext('2d');

                    // 填充白色背景
                    dotCtx.fillStyle = '#ffffff';
                    dotCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 波点效果处理
                    const gridSize = 1;  // 网格大小，控制点阵密度

                    // 遍历图像，按网格处理
                    for (let y = 0; y < CROP_HEIGHT; y += gridSize) {
                        for (let x = 0; x < CROP_WIDTH; x += gridSize) {
                            // 计算当前网格区域的平均亮度
                            let totalBrightness = 0;
                            let pixelCount = 0;

                            // 遍历当前网格内的所有像素
                            for (let gy = 0; gy < gridSize && (y + gy) < CROP_HEIGHT; gy++) {
                                for (let gx = 0; gx < gridSize && (x + gx) < CROP_WIDTH; gx++) {
                                    const pixelX = x + gx;
                                    const pixelY = y + gy;
                                    const idx = (pixelY * CROP_WIDTH + pixelX) * 4;

                                    const r = data[idx];
                                    const g = data[idx + 1];
                                    const b = data[idx + 2];

                                    // 检查是否为背景色（接近#eeeeee）
                                    if (!(r > 235 && g > 235 && b > 235)) {
                                        // 计算亮度 (0-255)
                                        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                                        totalBrightness += brightness;
                                        pixelCount++;
                                    }
                                }
                            }

                            // 如果当前网格区域有非背景像素
                            if (pixelCount > 0) {
                                const avgBrightness = totalBrightness / pixelCount;

                                // 根据平均亮度决定绘制黑点还是白点
                                // 亮度越低（越暗）越可能绘制黑点
                                const threshold = 255 - avgBrightness; // 反转亮度逻辑
                                const shouldDrawBlack = Math.random() * 255 < threshold;

                                if (shouldDrawBlack) {
                                    dotCtx.fillStyle = '#000000';
                                    // 绘制方形点阵
                                    dotCtx.fillRect(x, y, gridSize, gridSize);
                                }
                                // 白点不需要绘制，因为背景已经是白色
                            }
                        }
                    }

                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.fillStyle = BG_COLOR;
                    previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 先绘制原图，再绘制点阵
                    previewCtx.drawImage(img, 0, 0);
                    previewCtx.drawImage(dotCanvas, 0, 0);

                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('波点效果');

                    dotCanvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showUndoBtn = true;
                        this.undoDisabled = false;
                        this.showStatus('uploadStatus', '波点效果已应用', 'success');
                        this.pixelizeDisabled = false;
                        this.pixelizeText = '波点效果';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('波点效果错误:', error);
                    this.showStatus('uploadStatus', `处理失败：${error.message}`, 'error');
                    this.pixelizeDisabled = false;
                    this.pixelizeText = '波点效果';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.pixelizeDisabled = false;
                this.pixelizeText = '波点效果';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },

        applyGeometric() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.geometricDisabled = true;
            this.geometricText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = CROP_WIDTH;
                    canvas.height = CROP_HEIGHT;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 几何分割：Voronoi式的随机分割
                    const gridSize = 20;
                    const points = [];

                    for (let y = 0; y < CROP_HEIGHT; y += gridSize) {
                        for (let x = 0; x < CROP_WIDTH; x += gridSize) {
                            points.push({
                                x: x + Math.random() * gridSize,
                                y: y + Math.random() * gridSize,
                                color: this.getPixelColor(data, x, y, CROP_WIDTH)
                            });
                        }
                    }

                    // 清空并重新绘制
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    for (let y = 0; y < CROP_HEIGHT; y += 4) {
                        for (let x = 0; x < CROP_WIDTH; x += 4) {
                            let closestPoint = points[0];
                            let minDist = Infinity;

                            for (let p of points) {
                                const dist = (p.x - x) ** 2 + (p.y - y) ** 2;
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestPoint = p;
                                }
                            }

                            ctx.fillStyle = closestPoint.color;
                            ctx.fillRect(x, y, 4, 4);
                        }
                    }

                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.fillStyle = BG_COLOR;
                    previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.drawImage(canvas, 0, 0);

                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('几何分割');

                    canvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showUndoBtn = true;
                        this.undoDisabled = false;
                        this.showStatus('uploadStatus', '几何分割已应用', 'success');
                        this.geometricDisabled = false;
                        this.geometricText = '几何分割';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('几何分割错误:', error);
                    this.showStatus('uploadStatus', `处理失败：${error.message}`, 'error');
                    this.geometricDisabled = false;
                    this.geometricText = '几何分割';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.geometricDisabled = false;
                this.geometricText = '几何分割';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },

        applyParticle() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.particleDisabled = true;
            this.particleText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = CROP_WIDTH;
                    canvas.height = CROP_HEIGHT;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 粒子化：用圆形粒子表示
                    const particleSize = 4;
                    ctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    for (let i = 0; i < data.length; i += 4) {
                        if (Math.random() > 0.7) { // 采样30%的像素
                            const pixelIdx = i / 4;
                            const x = pixelIdx % CROP_WIDTH;
                            const y = Math.floor(pixelIdx / CROP_WIDTH);

                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const brightness = (r + g + b) / 3;

                            ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
                            ctx.beginPath();
                            ctx.arc(x, y, particleSize * (brightness / 255), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }

                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.fillStyle = BG_COLOR;
                    previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.drawImage(canvas, 0, 0);

                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('粒子化');

                    canvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showUndoBtn = true;
                        this.undoDisabled = false;
                        this.showStatus('uploadStatus', '粒子化已应用', 'success');
                        this.particleDisabled = false;
                        this.particleText = '粒子化';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('粒子化错误:', error);
                    this.showStatus('uploadStatus', `处理失败：${error.message}`, 'error');
                    this.particleDisabled = false;
                    this.particleText = '粒子化';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.particleDisabled = false;
                this.particleText = '粒子化';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },

        applyLowPoly() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可处理的图片', 'error');
                return;
            }

            this.lowPolyDisabled = true;
            this.lowPolyText = '处理中...';

            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = CROP_WIDTH;
                    canvas.height = CROP_HEIGHT;
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 低多边形：三角形分割
                    const triangleSize = 25;
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    for (let y = 0; y < CROP_HEIGHT; y += triangleSize) {
                        for (let x = 0; x < CROP_WIDTH; x += triangleSize) {
                            const color1 = this.getPixelColor(data, x, y, CROP_WIDTH);
                            const color2 = this.getPixelColor(data, x + triangleSize, y, CROP_WIDTH);
                            const color3 = this.getPixelColor(data, x, y + triangleSize, CROP_WIDTH);

                            // 绘制三角形
                            ctx.fillStyle = color1;
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(x + triangleSize, y);
                            ctx.lineTo(x, y + triangleSize);
                            ctx.fill();

                            ctx.fillStyle = color2;
                            ctx.beginPath();
                            ctx.moveTo(x + triangleSize, y);
                            ctx.lineTo(x + triangleSize, y + triangleSize);
                            ctx.lineTo(x, y + triangleSize);
                            ctx.fill();
                        }
                    }

                    const previewCanvas = this.$refs.previewCanvas;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.fillStyle = BG_COLOR;
                    previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    previewCtx.drawImage(canvas, 0, 0);

                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('低多边形');

                    canvas.toBlob((blob) => {
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showUndoBtn = true;
                        this.undoDisabled = false;
                        this.showStatus('uploadStatus', '低多边形艺术已应用', 'success');
                        this.lowPolyDisabled = false;
                        this.lowPolyText = '低多边形';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('低多边形错误:', error);
                    this.showStatus('uploadStatus', `处理失败：${error.message}`, 'error');
                    this.lowPolyDisabled = false;
                    this.lowPolyText = '低多边形';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.lowPolyDisabled = false;
                this.lowPolyText = '低多边形';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },



        getPixelColor(data, x, y, width) {
            x = Math.max(0, Math.min(Math.floor(x), width - 1));
            y = Math.max(0, Math.min(Math.floor(y), CROP_HEIGHT - 1));
            const idx = (y * width + x) * 4;
            return `rgb(${data[idx]},${data[idx + 1]},${data[idx + 2]})`;
        },

        compressImage() {
            // 目标：生成 596x832 的 PNG，尽力使文件 <= 200KB（最佳努力）
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可压缩的图片', 'error');
                return;
            }

            this.compressDisabled = true;
            this.compressText = '压缩中...';

            // 将当前状态入撤销栈以便可以撤销压缩
            try {
                if (this.croppedBlob) {
                    this.undoStack.push(this.croppedBlob);
                    this.undoLabels.push('压缩');
                    this.showUndoBtn = true;
                    this.undoDisabled = false;
                }
            } catch (e) {
                console.warn('入撤销栈失败', e);
            }

            const targetW = CROP_WIDTH;
            const targetH = CROP_HEIGHT;
            const maxBytes = 200 * 1024;

            const img = new Image();
            const url = URL.createObjectURL(this.croppedBlob);

            img.onload = async () => {
                try {
                    // 创建目标画布并按 cover（居中裁剪填满）绘制
                    const canvas = document.createElement('canvas');
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext('2d');

                    this.drawImageCover(ctx, img, targetW, targetH, BG_COLOR);

                    // 首次导出 PNG
                    let blob = await new Promise((resolve) => canvas.toBlob(resolve, IMAGE_PNG));
                    let bestBlob = blob;

                    if (blob.size <= maxBytes) {
                        // 已满足大小要求
                        this.croppedBlob = blob;
                        this.imageSizeKB = Math.round(blob.size / 1024);
                        this.showStatus('uploadStatus', `已生成 PNG：${this.imageSizeKB}KB`, 'success');
                        this.showCompressBtn = this.imageSizeKB > 180;

                        // 回显到预览画布，确保背景为 BG_COLOR
                        const previewCanvas = this.$refs.previewCanvas;
                        if (previewCanvas) {
                            const pctx = previewCanvas.getContext('2d');
                            pctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                            pctx.fillStyle = BG_COLOR;
                            pctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                            const resultImg = new Image();
                            const bUrl = URL.createObjectURL(blob);
                            resultImg.onload = () => {
                                const scale = Math.min(CROP_WIDTH / resultImg.width, CROP_HEIGHT / resultImg.height);
                                const w = resultImg.width * scale;
                                const h = resultImg.height * scale;
                                const x = (CROP_WIDTH - w) / 2;
                                const y = (CROP_HEIGHT - h) / 2;
                                pctx.drawImage(resultImg, x, y, w, h);
                                URL.revokeObjectURL(bUrl);
                            };
                            resultImg.src = bUrl;

                            this.showPreview = true;
                            this.showCropControls = true;
                            this.showUploadBtn = true;
                            this.showImageInfo = true;
                        }

                        return;
                    }

                    // 如果超出大小，尝试逐步降低色深（简单量化）以减少 PNG 大小
                    const colorLevels = [64, 32, 16, 8, 4, 2];
                    for (let lvl of colorLevels) {
                        const qCanvas = document.createElement('canvas');
                        qCanvas.width = targetW;
                        qCanvas.height = targetH;
                        const qCtx = qCanvas.getContext('2d');
                        // 先把原绘制内容复制过去
                        qCtx.drawImage(canvas, 0, 0);

                        try {
                            const imageData = qCtx.getImageData(0, 0, targetW, targetH);
                            this.reduceColorDepth(imageData, lvl);
                            qCtx.putImageData(imageData, 0, 0);
                        } catch (e) {
                            // 某些浏览器对跨域图片可能拒绝 getImageData，但我们的图片是 dataURL/blob，通常安全
                            console.warn('量化失败或被浏览器限制，跳过量化：', e);
                        }

                        const qblob = await new Promise((resolve) => qCanvas.toBlob(resolve, IMAGE_PNG));
                        if (qblob && qblob.size < bestBlob.size) {
                            bestBlob = qblob;
                        }
                        if (qblob && qblob.size <= maxBytes) {
                            blob = qblob;
                            break;
                        }
                    }

                    // 如果经过量化仍然超出 maxBytes，保留最小的 PNG 作为结果，并告知用户
                    if (bestBlob.size < blob.size) blob = bestBlob;

                    this.croppedBlob = blob;
                    this.imageSizeKB = Math.round(blob.size / 1024);

                    if (blob.size <= maxBytes) {
                        this.showStatus('uploadStatus', `PNG 压缩成功：${this.imageSizeKB}KB`, 'success');
                    } else {
                        this.showStatus('uploadStatus', `已尽力压缩为 PNG（${this.imageSizeKB}KB），仍超过200KB，建议手动进一步裁剪或允许 WebP/JPEG 格式。`, 'warning');
                    }

                    this.showCompressBtn = this.imageSizeKB > 180;

                    // 回显压缩结果到预览画布，确保背景为 BG_COLOR
                    const previewCanvas = this.$refs.previewCanvas;
                    if (previewCanvas) {
                        const pctx = previewCanvas.getContext('2d');
                        pctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                        pctx.fillStyle = BG_COLOR;
                        pctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                        const resultImg = new Image();
                        const bUrl = URL.createObjectURL(blob);
                        resultImg.onload = () => {
                            const scale = Math.min(CROP_WIDTH / resultImg.width, CROP_HEIGHT / resultImg.height);
                            const w = resultImg.width * scale;
                            const h = resultImg.height * scale;
                            const x = (CROP_WIDTH - w) / 2;
                            const y = (CROP_HEIGHT - h) / 2;
                            pctx.drawImage(resultImg, x, y, w, h);
                            URL.revokeObjectURL(bUrl);
                        };
                        resultImg.src = bUrl;

                        this.showPreview = true;
                        this.showCropControls = true;
                        this.showUploadBtn = true;
                        this.showImageInfo = true;
                    }
                } catch (error) {
                    console.error('压缩失败：', error);
                    this.showStatus('uploadStatus', '图片压缩失败', 'error');
                } finally {
                    this.compressDisabled = false;
                    this.compressText = '压缩图片';
                    URL.revokeObjectURL(url);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                this.compressDisabled = false;
                this.compressText = '压缩图片';
                this.showStatus('uploadStatus', '图片加载失败，无法压缩', 'error');
            };

            img.src = url;
        },
        resizeBlobToTargetDimensions(blob, targetWidth, targetHeight) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    if (img.width === targetWidth && img.height === targetHeight) {
                        resolve(blob);
                        URL.revokeObjectURL(img.src);
                        return;
                    }
                    // 创建canvas并绘制图片到目标尺寸
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');

                    // 填充背景色
                    ctx.fillStyle = BG_COLOR;
                    ctx.fillRect(0, 0, targetWidth, targetHeight);

                    // 绘制图片（保持宽高比居中）
                    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    const x = (targetWidth - scaledWidth) / 2;
                    const y = (targetHeight - scaledHeight) / 2;

                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                    // 转换为blob
                    canvas.toBlob(resolve, IMAGE_PNG, 0.85);
                    URL.revokeObjectURL(img.src);
                };

                img.onerror = () => {
                    URL.revokeObjectURL(img.src);
                    reject(new Error('图片加载失败'));
                };

                img.src = URL.createObjectURL(blob);
            });
        },

        // 将图片按 cover（填满）方式绘制到目标 canvas（居中裁剪）
        drawImageCover(ctx, img, targetW, targetH, bgColor = '#ffffff') {
            // 填充背景
            try {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, targetW, targetH);
            } catch (e) {
                // 忽略填充错误
            }

            const scale = Math.max(targetW / img.width, targetH / img.height); // cover 模式
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const dx = (targetW - drawW) / 2;
            const dy = (targetH - drawH) / 2;
            ctx.drawImage(img, dx, dy, drawW, drawH);
        },

        // 简单颜色量化：将每个颜色通道压缩到指定 levels（例如 16,8,4 等）以降低 PNG 大小
        reduceColorDepth(imageData, levels) {
            if (!imageData || !imageData.data) return;
            const data = imageData.data;
            const lvl = Math.max(1, Math.floor(levels));
            const step = Math.max(1, Math.floor(256 / lvl));

            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.floor(data[i] / step) * step; // R
                data[i + 1] = Math.floor(data[i + 1] / step) * step; // G
                data[i + 2] = Math.floor(data[i + 2] / step) * step; // B
                // 保留 alpha 不变
            }
        },

        compressPngWithoutResize(imageFile, maxSizeKB, callback) {
            // 使用 Canvas 进行精确的尺寸控制和压缩
            const targetWidth = 596;
            const targetHeight = 832;

            const img = new Image();
            const url = URL.createObjectURL(imageFile);

            img.onload = () => {
                // 创建画布并设置目标尺寸
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');

                // 填充背景色
                ctx.fillStyle = BG_COLOR;
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                // 计算缩放比例，保持图片比例不变并居中显示
                const scaleX = targetWidth / img.width;
                const scaleY = targetHeight / img.height;
                const scale = Math.min(scaleX, scaleY);

                const drawWidth = img.width * scale;
                const drawHeight = img.height * scale;
                const drawX = (targetWidth - drawWidth) / 2;
                const drawY = (targetHeight - drawHeight) / 2;

                // 绘制缩放后的图片到画布中央
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // 转换为 Blob 并回调
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        const fileSizeKB = blob.size / 1024;

                        if (fileSizeKB > 200) {
                            // 文件仍然大于200KB，提示用户
                            this.showStatus(
                                'uploadStatus',
                                `压缩后文件大小为${fileSizeKB.toFixed(1)}KB，仍超过200KB限制。建议使用其他软件预处理或裁剪图片减少信息量`,
                                'warning'
                            );
                        } else {
                            // 显示成功的状态信息
                            this.showStatus(
                                'uploadStatus',
                                `压缩完成，文件大小${fileSizeKB.toFixed(1)}KB`,
                                'success'
                            );
                        }
                        // 显示压缩后的图片
                        const compressedImageUrl = URL.createObjectURL(blob);
                        this.currentImageSrc = compressedImageUrl;
                        this.showPreview = true;
                        this.showCropper = false;

                        callback(blob);
                    },
                    'image/png',
                    0.9 // PNG 质量设置
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                console.error('图片加载失败');
                callback(imageFile); // 出错时返回原图
            };

            img.src = url;
        },
        closeUploadSuccess() {
            this.showUploadSuccess = false;
            this.resetUploadInterface();
        },
        uploadImage() {
            this.showStatus('uploadStatus', '上传功能暂不可用', 'error');
                return;
            if (!this.isLoggedIn) {
                this.showStatus('uploadStatus', '请先登录后再上传图片', 'error');
                return;
            }

            const sizeKB = Math.round(this.croppedBlob.size / 1024);
            if (sizeKB > 200 && this.compressInfo) {
                this.showStatus('uploadStatus', '图片大小超过200KB，请使用压缩功能', 'error');
                return;
            }

            const timestamp = Date.now();
            const sign = CryptoJS.MD5(SIGN_SALT + this.userData.id + timestamp).toString();

            const formData = new FormData();
            formData.append('file', this.croppedBlob, UPLOAD_FILENAME);
            formData.append('height', `${CROP_HEIGHT}`);
            formData.append('width', `${CROP_WIDTH}`);
            formData.append('sign', sign);
            formData.append('t', `${timestamp}`);
            formData.append('token', `Bearer ${this.userData.token}`);

            this.uploadDisabled = true;
            this.uploadText = '上传中...';

            axios.post(this.UPLOAD_API_URL, formData)
                .then(({ data }) => {
                    if (data && data.code === 0) {
                        this.showUploadSuccess = true;
                        this.showStatus('uploadStatus', '图片上传成功', 'success');
                        this.hasUploaded = true;
                    } else {
                        let msg = (data && data.message) || '上传失败';
                        if (msg && msg.includes('文件上传失败')) {
                            msg = '上传失败, 可能已达今日上传上限10次';
                        }
                        this.showStatus('uploadStatus', ("喜茶服务端返回：" + msg), 'error');
                    }
                })
                .catch(error => {
                    this.showStatus('uploadStatus', '网络错误，请稍后重试', 'error');
                    console.error('上传错误:', error);
                }).finally(() => {
                    this.uploadDisabled = false;
                    this.uploadText = '上传图片';
                });
        },
        saveImage() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可保存的图片', 'error');
                return;
            }

            this.saveDisabled = true;
            this.saveText = '保存中...';

            try {
                // 创建一个临时的下载链接
                const url = URL.createObjectURL(this.croppedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'heytea-image-' + new Date().getTime() + '.png';
                document.body.appendChild(a);
                a.click();

                // 清理
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.saveDisabled = false;
                    this.saveText = '保存图片';
                    this.showStatus('uploadStatus', '图片保存成功', 'success');
                }, 100);
            } catch (error) {
                console.error('保存图片失败:', error);
                this.showStatus('uploadStatus', '保存图片失败', 'error');
                this.saveDisabled = false;
                this.saveText = '保存图片';
            }
        },
        undoLastAction() {
            if (this.undoStack.length === 0) {
                this.showStatus('uploadStatus', '没有可撤销的操作', 'error');
                return;
            }

            this.undoDisabled = true;
            this.undoButtonText = '撤销中...';

            // 弹出最后一个操作
            const previousBlob = this.undoStack.pop();
            const label = this.undoLabels.pop();

            const img = new Image();
            img.onload = () => {
                const previewCanvas = this.$refs.previewCanvas;
                const previewCtx = previewCanvas.getContext('2d');
                previewCtx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.fillStyle = BG_COLOR;
                previewCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
                previewCtx.drawImage(img, 0, 0);

                this.croppedBlob = previousBlob;
                this.imageSizeKB = Math.round(previousBlob.size / 1024);

                // 如果没有更多操作可撤销，隐藏撤销按钮
                if (this.undoStack.length <= 1) {
                    this.showUndoBtn = false;
                    this.undoDisabled = true;
                } else {
                    this.undoDisabled = false;
                }

                this.showStatus('uploadStatus', `已撤销：${label}`, 'success');
                this.undoButtonText = '撤销';
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '撤销失败', 'error');
                this.undoStack.push(previousBlob); // 恢复
                this.undoLabels.push(label);
                this.undoDisabled = false;
                this.undoButtonText = '撤销';
            };

            img.src = URL.createObjectURL(previousBlob);
        },
        // 在 methods 中添加打印预览方法
        generatePrintPreview() {
            if (!this.croppedBlob) {
                this.showStatus('uploadStatus', '没有可预览的图片', 'error');
                return;
            }

            this.printPreviewDisabled = true;
            this.printPreviewText = '生成预览中...';

            const img = new Image();
            img.onload = () => {
                try {
                    // 创建用于打印预览的画布
                    const printCanvas = document.createElement('canvas');
                    printCanvas.width = CROP_WIDTH;
                    printCanvas.height = CROP_HEIGHT;
                    const printCtx = printCanvas.getContext('2d');

                    // 填充打印背景为 #eeeeee（打印机对浅色区域处理为不打印）
                    const PRINT_BG = '#eeeeee';
                    printCtx.fillStyle = PRINT_BG;
                    printCtx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

                    // 按 contain 缩放并居中绘制到画布（避免拉伸）
                    const scale = Math.min(CROP_WIDTH / img.width, CROP_HEIGHT / img.height);
                    const drawW = img.width * scale;
                    const drawH = img.height * scale;
                    const dx = (CROP_WIDTH - drawW) / 2;
                    const dy = (CROP_HEIGHT - drawH) / 2;
                    printCtx.drawImage(img, dx, dy, drawW, drawH);

                    // 获取图像数据
                    const imageData = printCtx.getImageData(0, 0, CROP_WIDTH, CROP_HEIGHT);
                    const data = imageData.data;

                    // 模拟黑白打印效果
                    // 按感知亮度判断是否为“浅色”（>= #eeeeee），浅色视为不打印（白色），否则视为打印（黑色）
                    // #eeeeee 的 RGB 值约为 (238,238,238)，我们使用感知亮度阈值 238
                    const THRESHOLD = 128;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];

                        // 透明像素直接视为白色（不打印）
                        if (a === 0) {
                            data[i] = 255;
                            data[i + 1] = 255;
                            data[i + 2] = 255;
                            continue;
                        }

                        // 计算感知亮度
                        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                        // const luminance =(r + g + b)/3;
                        if (luminance >= THRESHOLD) {
                            // 浅色 -> 白色（不打印）
                            data[i] = 255;
                            data[i + 1] = 255;
                            data[i + 2] = 255;
                        } else {
                            // 深色 -> 黑色（打印）
                            data[i] = 0;
                            data[i + 1] = 0;
                            data[i + 2] = 0;
                        }
                        // 保留 alpha 通道不变
                    }

                    // 将处理后的数据放回画布
                    printCtx.putImageData(imageData, 0, 0);

                    // 显示预览模态框
                    const previewCanvas = document.createElement('canvas');
                    previewCanvas.width = CROP_WIDTH;
                    previewCanvas.height = CROP_HEIGHT;
                    const previewCtx = previewCanvas.getContext('2d');
                    previewCtx.drawImage(printCanvas, 0, 0);

                    previewCanvas.toBlob((blob) => {
                        this.printPreviewUrl = URL.createObjectURL(blob);
                        this.showPrintPreviewModal = true;
                        this.showStatus('uploadStatus', '打印预览已生成', 'success');
                        this.printPreviewDisabled = false;
                        this.printPreviewText = '打印预览';
                    }, IMAGE_PNG, 0.95);
                } catch (error) {
                    console.error('打印预览生成错误:', error);
                    this.showStatus('uploadStatus', `预览生成失败：${error.message}`, 'error');
                    this.printPreviewDisabled = false;
                    this.printPreviewText = '打印预览';
                }
            };

            img.onerror = () => {
                this.showStatus('uploadStatus', '图片加载失败', 'error');
                this.printPreviewDisabled = false;
                this.printPreviewText = '打印预览';
            };

            img.src = URL.createObjectURL(this.croppedBlob);
        },

        closePrintPreview() {
            this.showPrintPreviewModal = false;
            this.printPreviewUrl = null;
        },
        resetUploadInterface() {
            this.showCropper = false;
            this.showPreview = false;
            this.showCropControls = false;
            this.showImageInfo = false;
            this.showCompressBtn = false;
            this.showUploadBtn = false;
            this.compressInfo = '';
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
            this.currentImageSrc = null;
            this.destroyCropper();
            // 恢复上传区域显示
            this.hasUploaded = false;
            this.croppedBlob = null;
            // 重置描摹状态
            this.showDescribeModal = false;
            this.describeText = '';
            this.isDescribing = false;
            this.describeButtonDisabled = false;
            this.describeButtonText = '文字描摹';
            // 重置撤销栈
            this.undoStack = [];
            this.undoLabels = [];
            this.showUndoBtn = false;
            this.undoDisabled = false;
            this.undoButtonText = '撤销';
            // 重置打印预览功能
            this.printPreviewDisabled = false;
            this.printPreviewText = '打印预览';
            this.showPrintPreviewModal = false;
            this.printPreviewUrl = null;
            // 重置高级选项
            this.showAdvancedOptions = false;
            this.contrastDisabled = false;
            this.contrastText = '增加对比度';
            this.sketchDisabled = false;
            this.sketchText = '简笔画';
            this.pixelizeDisabled = false;
            this.pixelizeText = '波点效果';
            this.geometricDisabled = false;
            this.geometricText = '几何分割';
            this.particleDisabled = false;
            this.particleText = '粒子化';
            this.lowPolyDisabled = false;
            this.lowPolyText = '低多边形';
        },

        showStatus(type, message, statusType) {
            if (type === 'loginStatus') {
                this.loginStatus = { message, type: statusType };
            } else if (type === 'uploadStatus') {
                this.uploadStatus = { message, type: statusType };
            }

            setTimeout(() => {
                if (type === 'loginStatus') {
                    this.loginStatus = { message: '', type: '' };
                } else if (type === 'uploadStatus') {
                    this.uploadStatus = { message: '', type: '' };
                }
            }, 'error' === statusType ? 10000 : 5000);
        },
        checkSavedLogin() {
            const token = this.getCookie('userToken');
            if (token) {
                this.fetchData(`/api/service-member/vip/user/info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(data => {

                        if (data.code === 0) {
                            data = this.decryptResponseData(data.data);
                            const userData = data || {};
                            this.isLoggedIn = true;
                            this.userData = {
                                name: userData.name || '',
                                phone: userData.phone || '',
                                id: userData.user_main_id || '',
                                token: token
                            };
                            this.loginMethod = 'token';
                            this.token = token;
                            this.showStatus('loginStatus', '登录状态已恢复', 'success');
                        } else {
                            this.showStatus('loginStatus', '登录信息已失效，请重新登录', 'error');
                            this.setCookie('userToken', '', -1);
                            this.setCookie('userName', '', -1);
                            this.setCookie('userPhone', '', -1);
                            this.setCookie('userId', '', -1);
                        }
                    })
                    .catch(error => {
                        console.error('获取用户信息错误:', error);
                        this.showStatus('loginStatus', '登录信息验证失败，请刷新或重新登录', 'error');
                    });
            }
        },
        setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
        }, getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        }
    }
};
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.container {
    display: flex;
    width: 100%;
    max-width: 1200px;
    background: white;
    color: black;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    min-height: 1300px;
}

.left-panel {
    flex: 1;
    padding: 50px 40px;
    background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
    position: relative;
    border-right: 1px solid #eee;
    overflow-y: auto;
}

.right-panel {
    flex: 1.5;
    padding: 50px 40px;
    background: #fff;
    overflow-y: auto;
}

h2 {
    margin-bottom: 30px;
    color: #333;
    font-size: 26px;
    font-weight: 600;
    position: relative;
    padding-bottom: 15px;
}

h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px;
}

.form-group {
    margin-bottom: 25px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
    font-size: 15px;
}

input,
textarea {
    width: 100%;
    padding: 16px;
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

input:focus,
textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

textarea {
    min-height: 100px;
    resize: vertical;
}

.button-group {
    display: flex;
    gap: 15px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.button-group button {
    flex: 1;
    min-width: 120px;
}

button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border: none;
    outline: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    flex: 1;
    position: relative;
    overflow: hidden;
}

button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

button:active:not(:disabled) {
    transform: translateY(0);
}

button:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.login-help {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #667eea;
}

.help-text {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
}

.secondary-btn {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.logout-btn {
    background: linear-gradient(135deg, #ff416c, #ff4b2b);
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(255, 65, 108, 0.3);
    position: relative;
    overflow: hidden;
    width: 100%;
}

.logout-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 65, 108, 0.4);
}

.upload-area {
    border: 3px dashed #e1e5e9;
    border-radius: 15px;
    padding: 40px 20px;
    text-align: center;
    margin-bottom: 25px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fafafa;
    position: relative;
    overflow: hidden;
}

.upload-area:hover {
    border-color: #667eea;
    background: #f0f4ff;
    transform: translateY(-2px);
}

.upload-area p {
    margin: 10px 0;
    color: #666;
    font-size: 15px;
}

.upload-icon {
    font-size: 50px;
    color: #667eea;
    margin-bottom: 15px;
    animation: bounce 2s infinite;
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-10px);
    }

    60% {
        transform: translateY(-5px);
    }
}

canvas {
    width: 60%;
    max-width: 60%;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    display: block;
    border: 1px solid #eee;
}

.status {
    margin-top: 15px;
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    font-weight: 500;
    animation: fadeIn 0.3s ease;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.success {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    color: #155724;
    border: 1px solid #c3e6cb;
}

.error {
    background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.info {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.crop-controls {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
    flex-wrap: wrap;
}

.crop-btn {
    padding: 12px 20px;
    font-size: 15px;
    border-radius: 8px;
    min-width: 120px;
}

.dimensions-info {
    text-align: center;
    color: #666;
    font-size: 15px;
    margin-top: 15px;
    font-style: italic;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 8px;
    border: 2px solid #667eea;
}

.logo {
    text-align: center;
    margin-bottom: 40px;
}

.logo h1 {
    color: #333;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 1px;
}

.logo span {
    color: #667eea;
}

.cropper-container-body {
    position: relative;
    width: 75%;
    max-height: 500px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    display: block;
}

.cropper-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    cursor: move;
}

.cropper-selection {
    position: absolute;
    border: 2px dashed #fff;
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
    cursor: move;
    box-sizing: border-box;
}

.cropper-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #fff;
    border: 2px solid #667eea;
    border-radius: 50%;
}

.handle-nw {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
}

.handle-ne {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
}

.handle-sw {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
}

.handle-se {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
}

.user-info {
    margin-top: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.user-info h3 {
    margin-bottom: 15px;
    color: #1976d2;
    text-align: center;
}

.user-info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #bbdefb;
}

.user-info-item:last-child {
    border-bottom: none;
}

.user-info-label {
    font-weight: 500;
    color: #333;
    flex-shrink: 0;
}

.user-info-value {
    flex: 1;
    color: #1976d2;
    font-weight: 600;
    word-break: break-all;
    text-align: right;
}

.toggle-visibility {
    margin-left: 10px;
    cursor: pointer;
    font-size: 18px;
    user-select: none;
}

.login-method {
    margin-bottom: 20px;
    text-align: center;
}

.login-method label {
    display: inline-block;
    margin-right: 20px;
    cursor: pointer;
}

.login-method input[type="radio"] {
    width: auto;
    margin-right: 5px;
}

.login-form {
    margin-top: 20px;
}

.image-info-card {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #d1e0f0;
}

.image-info-card h3 {
    color: #2c3e50;
    margin-bottom: 15px;
    text-align: center;
    font-size: 18px;
}

.image-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.image-info-item {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.image-info-item strong {
    display: block;
    color: #3498db;
    margin-bottom: 5px;
}

.image-info-item span {
    color: #2c3e50;
    font-size: 14px;
}

.remove-bg-btn {
    background: linear-gradient(135deg, #FF9800, #F57C00);
}

/* 保持去除背景按钮在禁用状态下也显示主题色（避免变成白色/灰色） */
.remove-bg-btn:disabled {
    background: linear-gradient(135deg, #FF9800, #F57C00);
    opacity: 0.75;
    cursor: not-allowed;
    box-shadow: none;
    color: #fff;
}

.grayscale-btn {
    background: linear-gradient(135deg, #9E9E9E, #616161);
}

.describe-btn {
    background: linear-gradient(135deg, #7C4DFF, #651FFF);
}

.describe-btn:disabled {
    background: linear-gradient(135deg, #7C4DFF, #651FFF);
    opacity: 0.75;
    cursor: not-allowed;
    box-shadow: none;
    color: #fff;
}

.undo-btn {
    background: linear-gradient(135deg, #FF6F00, #E65100);
}

.undo-btn:disabled {
    background: linear-gradient(135deg, #FF6F00, #E65100);
    opacity: 0.75;
    cursor: not-allowed;
    box-shadow: none;
    color: #fff;
}

.sketch-btn {
    background: linear-gradient(135deg, #795548, #5D4037);
}

.sketch-btn:disabled {
    background: linear-gradient(135deg, #795548, #5D4037);
    opacity: 0.75;
    cursor: not-allowed;
}

.more-btn {
    background: linear-gradient(135deg, #607D8B, #37474F);
}

.more-btn:hover {
    background: linear-gradient(135deg, #37474F, #263238);
}

.advanced-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
    /* 允许换行 */
    padding: 10px;
    background: #f5f5f5;
    border-radius: 8px;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
        overflow: hidden;
    }

    to {
        opacity: 1;
        max-height: 300px;
    }
}

.advanced-controls .crop-btn {
    min-width: 100px;
}

.pixelize-btn {
    background: linear-gradient(135deg, #E91E63, #C2185B);
}

.pixelize-btn:disabled {
    background: linear-gradient(135deg, #E91E63, #C2185B);
    opacity: 0.75;
    cursor: not-allowed;
}

.contrast-btn {
    background: linear-gradient(135deg, #ff3b41, #fd744e);
}

.contrast-btn:disabled {
    background: linear-gradient(135deg, #ff3b41, #fd744e);
    opacity: 0.75;
    cursor: not-allowed;
}

.preview-btn {
    background: linear-gradient(135deg, #37d434, #42cdb8);
}

.preview-btn:disabled {
    background: linear-gradient(135deg, #37d434, #42cdb8);
    opacity: 0.75;
    cursor: not-allowed;
}

.geometric-btn {
    background: linear-gradient(135deg, #9C27B0, #7B1FA2);
}

.geometric-btn:disabled {
    background: linear-gradient(135deg, #9C27B0, #7B1FA2);
    opacity: 0.75;
    cursor: not-allowed;
}

.particle-btn {
    background: linear-gradient(135deg, #00BCD4, #0097A7);
}

.particle-btn:disabled {
    background: linear-gradient(135deg, #00BCD4, #0097A7);
    opacity: 0.75;
    cursor: not-allowed;
}

.lowpoly-btn {
    background: linear-gradient(135deg, #FF9800, #E65100);
}

.lowpoly-btn:disabled {
    background: linear-gradient(135deg, #FF9800, #E65100);
    opacity: 0.75;
    cursor: not-allowed;
}

.collage-btn {
    background: linear-gradient(135deg, #3F51B5, #283593);
}

.collage-btn:disabled {
    background: linear-gradient(135deg, #3F51B5, #283593);
    opacity: 0.75;
    cursor: not-allowed;
}

.compress-info {
    text-align: center;
    color: #666;
    font-size: 14px;
    margin: 10px 0;
}

.notice {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.disclaimer-container {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
}

.disclaimer-btn {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 16px 24px;
    border-radius: 6px;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.disclaimer-btn:hover {
    background: #ff5252;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #666;
}

.modal-body {
    padding: 20px;
}

.modal-body p {
    margin: 10px 0;
    line-height: 1.6;
    color: #555;
}

.modal-footer {
    padding: 20px;
    text-align: center;
    border-top: 1px solid #eee;
}

.confirm-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.confirm-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.confirm-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.cancel-btn {
    background: #999;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(153, 153, 153, 0.3);
}

.cancel-btn:hover {
    background: #777;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(153, 153, 153, 0.4);
}

.upload-success-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    padding: 30px;
    min-width: 320px;
    max-width: 90vw;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

.success-content {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 25px;
}

.success-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
}

.success-text h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
}

.success-text p {
    margin: 0;
    color: #666;
    line-height: 1.5;
    font-size: 0.95rem;
}

.success-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.primary-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}


@keyframes slideIn {
    from {
        opacity: 0;
        transform: translate(-50%, -45%);
    }

    to {
        opacity: 1;
        transform: translate(-50%, -50%);
    }
}

/* 打印预览模态框样式优化 */
.print-preview-modal .modal-content {
    max-width: 400px;
}

.print-preview-modal .modal-header {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.print-preview-modal .modal-header h3 {
    margin: 0;
    font-size: 1.4rem;
    color: #333;
}

.print-preview-modal .modal-body {
    padding: 20px 20px 0 20px;
    text-align: center;
    margin: auto;
}

.print-preview-modal .preview-warning {
    background-color: #fff8e1;
    border: 1px solid #ffecb3;
    border-radius: 6px;
    padding: 10px;
    font-size: 12px;
    color: #886a00;
    text-align: left;
}

.print-preview-modal .preview-container {
    margin: 15px auto;
    background: white;
    padding: 12px;
    display: inline-block;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.print-preview-modal .preview-image {
    max-width: 200px;
    height: auto;
    image-rendering: pixelated;
    display: block;
}

.print-preview-modal .modal-footer {
    padding: 15px 50px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: center;
}

.print-preview-modal .confirm-btn {
    padding: 8px 24px;
    font-size: 14px;
}


/* 移动端适配样式 */
@media (max-width: 768px) {
    .container {
        flex-direction: column;
        padding: 10px;
    }

    .left-panel,
    .right-panel {
        width: 100%;
        padding: 25px;
    }

    .right-panel {
        margin-top: 20px;
        margin-bottom: 60px;
    }

    .upload-success-panel {
        width: 90%;
        padding: 20px;
        min-width: 280px;
    }

    .success-content {
        flex-direction: column;
        text-align: center;
        align-items: center;
        gap: 12px;
    }

    .success-actions {
        flex-direction: column;
    }

    .primary-btn {
        width: 100%;
    }

    .token-display {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .upload-area {
        padding: 30px 20px;
        min-height: 200px;
    }

    .upload-icon {
        font-size: 48px;
        margin-bottom: 15px;
    }

    .upload-area p {
        font-size: 14px;
        margin: 8px 0;
    }

    .dimensions-info {
        font-size: 12px;
    }

    .preview-container {
        max-height: 400px;
    }

    .cropper-container {
        height: 300px;
    }

    .cropper-container-body {
        width: 90%;
    }

    .action-buttons {
        flex-wrap: wrap;
        gap: 10px;
    }

    .action-buttons button {
        flex: 1 1 calc(50% - 10px);
        min-width: 120px;
        min-height: 44px;
        /* 符合移动端触摸标准 */
        font-size: 14px;
    }

    .control-buttons {
        flex-direction: column;
        gap: 10px;
    }

    .control-buttons button {
        width: 100%;
        min-height: 44px;
        font-size: 16px;
    }

    /* 模态框适配 */
    .modal-overlay {
        padding: 10px;
    }

    .modal-content {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 15px;
        max-height: 90vh;
    }

    .modal-header h3 {
        font-size: 18px;
        margin: 0 0 15px 0;
    }

    .modal-body {
        font-size: 14px;
    }

    .modal-body textarea {
        height: 80px;
        font-size: 16px;
        /* 防止iOS缩放 */
    }

    .modal-footer {
        flex-direction: column;
        gap: 10px;
    }

    .modal-footer button {
        width: 100%;
        min-height: 44px;
        margin: 0 !important;
    }

    /* 登录表单适配 */
    .login-form {
        padding: 15px;
    }

    .form-group input,
    .form-group textarea {
        color: black;
        font-size: 16px;
        /* 防止iOS缩放 */
        padding: 12px;
    }

    .button-group {
        flex-direction: column;
        gap: 10px;
    }

    .button-group button {
        width: 100%;
        min-height: 44px;
    }

    /* 状态消息适配 */
    .status-message {
        font-size: 14px;
        padding: 8px 12px;
    }

    /* 图片预览适配 */
    #previewImage {
        max-height: 300px;
        object-fit: contain;
    }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
    .container {
        padding: 5px;
    }

    .left-panel,
    .right-panel {
        padding: 10px;
    }

    .action-buttons button {
        flex: 1 1 100%;
    }

    h2 {
        font-size: 18px;
        text-align: center;
    }

    .upload-area {
        min-height: 180px;
    }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
    button {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }

    button:active {
        transform: scale(0.98);
    }

    .upload-area {
        touch-action: manipulation;
    }
}
</style>