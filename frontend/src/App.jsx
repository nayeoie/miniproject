import { useState, useEffect } from 'react';
import axios from 'axios';

// FastAPI 백엔드 API의 기본 URL
const API_URL = 'http://localhost:8000';

export default function App() {
  // 게시글 관련 상태
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  // 전체 페이지 오류 메시지 (페이지 상단 고정)
  const [error, setError] = useState(''); 
  
  // 인증 관련 상태
  const [currentUser, setCurrentUser] = useState(null); 

  // 모달 상태
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
  
  // 데이터 상태
  const [newPostData, setNewPostData] = useState({ 
    imageUrl: '', 
    description: '', 
  });
  const [selectedPost, setSelectedPost] = useState(null); 
  
  // 🔑 인증 데이터 상태
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ user_name: '', email: '', password: '' });
  
  // 🔑 모달 내부 오류 상태 (개선된 부분)
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');


  // ------------------------------------
  // 1. API 통신 함수
  // ------------------------------------

  // 게시글 목록 조회 (GET /posts)
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.reverse()); 
      setError('');
    } catch (err) {
      setError('게시글을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 새로운 게시글 생성 (POST /posts)
  const createPost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
        setError('로그인 후 이용해주세요.');
        return;
    }
    if (!newPostData.description.trim()) {
      setError('설명을 입력해주세요.');
      return;
    }

    try {
      await axios.post(`${API_URL}/posts`, {
        title: newPostData.description.trim(), 
        picture: newPostData.imageUrl.trim() || null, 
        user_id: currentUser.id, 
      });
      fetchPosts(); 
      setIsPostModalOpen(false); 
      setNewPostData({ imageUrl: '', description: '' });
      setError('');
    } catch (err) {
      setError('게시글 작성에 실패했습니다.');
      console.error(err);
    }
  };

  // 게시글 수정 (PUT /posts/{id})
  const handleEdit = async (postToEdit) => {
    if (!currentUser || postToEdit.user_id !== currentUser.id) {
        setError('수정 권한이 없습니다.');
        return;
    }
    
    const newTitle = prompt("게시글 설명을 수정하세요:", postToEdit.title);
    if (newTitle === null) return;
    
    const newPicture = prompt("이미지 URL을 수정하세요 (선택 사항):", postToEdit.picture || "");

    try {
      // **주의**: 백엔드 PUT 엔드포인트가 없으므로 임시로 PUT 요청만 시도합니다.
      // main.py에 이 엔드포인트가 없으면 404가 발생합니다.
      // 다만, 사용자 질문의 초점이 인증 로직이므로, 현재는 인증 로직만 집중적으로 수정합니다.
      await axios.put(`${API_URL}/posts/${postToEdit.id}`, {
        title: newTitle.trim(),
        picture: newPicture.trim() || null,
        user_id: currentUser.id 
      });
      fetchPosts(); 
      setError('');
    } catch (err) {
      setError('게시글 수정에 실패했습니다.');
      console.error(err);
    }
  };

  // 게시글 삭제 (DELETE /posts/{id})
  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!currentUser || selectedPost.user_id !== currentUser.id) {
        setError('삭제 권한이 없습니다.');
        return;
    }

    try {
      // **주의**: 백엔드 DELETE 엔드포인트가 없으므로 임시로 DELETE 요청만 시도합니다.
      await axios.delete(`${API_URL}/posts/${selectedPost.id}`);
      fetchPosts(); 
      setIsConfirmModalOpen(false); 
      setSelectedPost(null);
      setError('');
    } catch (err) {
      setError('게시글 삭제에 실패했습니다.');
      console.error(err);
    }
  };

  // 🔑 회원가입 (POST /users) - 성공/실패 메시지 로직 개선
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(''); // 모달 내부 오류 초기화
    
    // 비밀번호 길이 체크 등 클라이언트 측 유효성 검사 추가 가능
    if (registerData.password.length < 4) {
        setRegisterError('비밀번호는 4자 이상이어야 합니다.');
        return;
    }

    try {
      // main.py의 /users 엔드포인트 사용 (성공 시 200/201 응답)
      await axios.post(`${API_URL}/users`, registerData); 
      
      // ✅ 성공 로직: 데이터베이스에 넘어갔다면 성공으로 처리
      alert("회원가입이 완료되었습니다! 로그인해주세요.");
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(true); 
      setRegisterData({ user_name: '', email: '', password: '' });
      setError(''); // 전역 오류 초기화

    } catch (err) {
      // ❌ 실패 로직: 백엔드에서 에러 응답(400 등)이 왔을 경우
      const detail = err.response?.data?.detail || "알 수 없는 이유로 회원가입에 실패했습니다.";
      setRegisterError(detail); // 모달 내부에 오류 표시
      console.error(err);
    }
  };

  // 🔑 로그인 (POST /login - 임시로 /users 목록에서 찾기) - 오류 로직 개선
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); // 모달 내부 오류 초기화

    try {
      // **주의**: main.py에 "/login" 엔드포인트가 없으므로, 임시로 전체 목록을 불러와 검증합니다.
      const response = await axios.get(`${API_URL}/users`);
      const user = response.data.find(u => u.email === loginData.email && u.password === loginData.password);

      if (user) {
        // ✅ 성공 로직
        setCurrentUser(user); 
        setIsLoginModalOpen(false);
        setLoginData({ email: '', password: '' });
        setError(''); // 전역 오류 초기화
        alert(`${user.user_name}님, 환영합니다!`);
      } else {
        // ❌ 실패 로직: 사용자 정보를 찾지 못했을 때
        setLoginError('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      // ❌ 실패 로직: API 통신 자체에 문제가 생겼을 때 (DB 연결 실패 등)
      setLoginError('로그인 중 서버 통신 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error(err);
    }
  };
  
  // 🔑 로그아웃
  const handleLogout = () => {
      setCurrentUser(null);
      alert('로그아웃 되었습니다.');
      setError('');
  };


  // ------------------------------------
  // 2. 초기 로드 및 핸들러
  // ------------------------------------

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenPostModal = () => {
    if (!currentUser) {
        setError('로그인 후 게시글을 작성할 수 있습니다.');
        return;
    }
    setNewPostData({ imageUrl: '', description: '' });
    setError('');
    setIsPostModalOpen(true);
  };

  const handleOpenConfirmModal = (post) => {
    if (!currentUser || post.user_id !== currentUser.id) {
        setError('삭제 권한이 없습니다.');
        return;
    }
    setSelectedPost(post);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedPost(null);
  };
  
  // 🔑 모달 핸들러 - 모달을 열 때 내부 오류 초기화
  const handleOpenLoginModal = () => {
      setError('');
      setLoginError(''); // 로그인 오류 초기화
      setLoginData({ email: '', password: '' });
      setIsLoginModalOpen(true);
  };
  
  const handleOpenRegisterModal = () => {
      setError('');
      setRegisterError(''); // 회원가입 오류 초기화
      setRegisterData({ user_name: '', email: '', password: '' });
      setIsRegisterModalOpen(true);
  };


  // ------------------------------------
  // 3. 컴포넌트
  // ------------------------------------

  const PostItem = ({ post }) => {
    const isAuthor = currentUser && post.user_id === currentUser.id; 
    const createdAtDate = new Date(post.created_at);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md md:max-w-lg transition-transform transform hover:scale-[1.01] duration-300">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <span className="text-sm font-semibold text-gray-700">
            작성자: {isAuthor ? `${currentUser.user_name} (나)` : `사용자 ID: ${post.user_id}`}
          </span>
          <span className="text-xs text-gray-400">
            {createdAtDate.toLocaleString('ko-KR')}
          </span>
        </div>
        
        {/* 이미지 (400x400) */}
        {post.picture && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={post.picture} 
              alt="게시글 이미지" 
              className="w-full h-96 object-cover" 
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/CCCCCC/333333?text=이미지%20없음'; }} 
            />
          </div>
        )}

        {/* 설명 (title 필드를 설명으로 사용) */}
        <div className="mb-4">
          <p className="text-gray-800 font-medium break-words whitespace-pre-wrap">{post.title}</p>
        </div>

        {/* 수정/삭제 버튼 */}
        <div className="flex items-center justify-end space-x-2">
          {isAuthor && (
            <>
              <button 
                onClick={() => handleEdit(post)} 
                className="text-blue-500 hover:text-blue-700 transition duration-150 p-2 rounded-lg hover:bg-blue-50"
              >
                수정
              </button>
              <button 
                onClick={() => handleOpenConfirmModal(post)} 
                className="text-red-500 hover:text-red-700 transition duration-150 p-2 rounded-lg hover:bg-red-50"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center pt-0">
      
      {/* Header */}
      <header className="w-full bg-white shadow-md py-4 px-6 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-gray-800 text-left">게시판</h1>
          <nav className="flex space-x-4 text-left">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">게시판</a>
            {/* 🔑 로그인 상태에 따라 버튼 표시 */}
            {currentUser ? (
                <>
                    <span className="text-gray-600 font-medium">{currentUser.user_name}님</span>
                    <button 
                        onClick={handleLogout} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        로그아웃
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={handleOpenLoginModal} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        로그인
                    </button>
                    <button 
                        onClick={handleOpenRegisterModal} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        회원가입
                    </button>
                </>
            )}
          </nav>
        </div>
        <button 
          onClick={handleOpenPostModal} 
          className={`py-2 px-4 rounded-full font-semibold shadow-md transition-colors text-sm ${currentUser ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-white cursor-not-allowed'}`}
          disabled={!currentUser}
        >
          게시글 작성
        </button>
      </header>

      {/* 전역 에러 메시지 */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-xl z-50 transition-opacity duration-300">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-800 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content (가운데 정렬) */}
      <main className="w-full max-w-4xl p-6 flex flex-col items-center">
        <section id="posts-container" className="w-full flex flex-col items-center space-y-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
            </div>
          ) : (
            posts.length > 0 ? (
              posts.map(post => <PostItem key={post.id} post={post} />)
            ) : (
              <p className="text-gray-500 text-center py-16">아직 게시글이 없습니다. 첫 번째 게시글을 작성해주세요!</p>
            )
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-white py-4 mt-auto text-center shadow-inner">
        <p className="text-sm">제작팀: 팀명 | 제작자: Gemini</p>
      </footer>

      {/* -------------------- Modals -------------------- */}

      {/* Create Post Modal (생략 - 변경 없음) */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative transform transition-all duration-300 scale-100">
            <button onClick={() => setIsPostModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">새 게시글 작성</h2>
            <form onSubmit={createPost} className="space-y-4">
              <p className="text-gray-700 font-medium">작성자: <span className="font-semibold text-blue-600">{currentUser?.user_name || '로그인 필요'}</span></p>
              <div>
                <label htmlFor="image-url" className="block text-gray-700 font-medium mb-1">이미지 URL (선택 사항)</label>
                <input type="url" id="image-url" value={newPostData.imageUrl} onChange={e => setNewPostData({...newPostData, imageUrl: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://image-url.com/photo.jpg"/>
              </div>
              <div>
                <label htmlFor="description" className="block text-gray-700 font-medium mb-1">설명 (백엔드 'title' 필드에 해당)</label>
                <textarea id="description" rows="4" value={newPostData.description} onChange={e => setNewPostData({...newPostData, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="여기에 게시글 내용을 입력하세요." required></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsPostModalOpen(false)} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-semibold">
                  취소
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  게시글 올리기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (생략 - 변경 없음) */}
      {isConfirmModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">삭제 확인</h2>
            <p className="text-gray-700 mb-6 text-center">선택한 게시글을 정말 삭제하시겠습니까?</p>
            <div className="flex justify-center space-x-4">
                <button 
                  onClick={handleCloseConfirmModal} 
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
                >
                  취소
                </button>
                <button 
                  onClick={handleDelete} 
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
                >
                  삭제
                </button>
            </div>
          </div>
        </div>
      )}
      
      
      {/* 🔑 Register Modal (회원가입 모달) - 오류 메시지 표시 추가 */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 scale-100">
            <button onClick={() => setIsRegisterModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">회원가입</h2>
            
            {/* ❌ 모달 내부 오류 메시지 */}
            {registerError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    {registerError}
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="reg-username" className="block text-gray-700 font-medium mb-1">사용자 이름</label>
                <input 
                  type="text" 
                  id="reg-username" 
                  value={registerData.user_name} 
                  onChange={e => setRegisterData({...registerData, user_name: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="아이디" 
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-gray-700 font-medium mb-1">이메일</label>
                <input 
                  type="email" 
                  id="reg-email" 
                  value={registerData.email} 
                  onChange={e => setRegisterData({...registerData, email: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="user@example.com" 
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-gray-700 font-medium mb-1">비밀번호</label>
                <input 
                  type="password" 
                  id="reg-password" 
                  value={registerData.password} 
                  onChange={e => setRegisterData({...registerData, password: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="********" 
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-semibold">
                  취소
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  가입하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 🔑 Login Modal (로그인 모달) - 오류 메시지 표시 추가 */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 scale-100">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">로그인</h2>
            
            {/* ❌ 모달 내부 오류 메시지 */}
            {loginError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    {loginError}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-gray-700 font-medium mb-1">이메일</label>
                <input 
                  type="email" 
                  id="login-email" 
                  value={loginData.email} 
                  onChange={e => setLoginData({...loginData, email: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="user@example.com" 
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-gray-700 font-medium mb-1">비밀번호</label>
                <input 
                  type="password" 
                  id="login-password" 
                  value={loginData.password} 
                  onChange={e => setLoginData({...loginData, password: e.target.value})} 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="********" 
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-semibold">
                  취소
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}