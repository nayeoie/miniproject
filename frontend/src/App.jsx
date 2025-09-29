import { useState, useEffect } from 'react';
import axios from 'axios';

// FastAPI 백엔드 API의 기본 URL
const API_URL = 'http://localhost:8000';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 게시글 작성 모달 상태
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostData, setNewPostData] = useState({ 
    username: '익명의 사용자', // 표시용
    imageUrl: '', // 백엔드 Post 모델의 'picture' 필드에 해당
    description: '', // 백엔드 Post 모델의 'title' 필드에 해당
  });

  // 수정/삭제 확인 모달 상태
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // 선택된 게시글 데이터

  // 임시 사용자 ID (백엔드 user_id를 1로 고정하여 임시 연동)
  const TEMP_USER_ID = 1;


  // ------------------------------------
  // 1. API 통신 함수
  // ------------------------------------

  // 게시글 목록 조회 (GET /posts)
  const fetchPosts = async () => {
    try {
      setLoading(true);
      // 백엔드가 created_at 내림차순으로 정렬해서 반환한다고 가정
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data);
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
    if (!newPostData.description.trim()) {
      setError('설명을 입력해주세요.');
      return;
    }

    try {
      // 프론트엔드 필드명을 백엔드 Post 모델 필드에 맞게 매핑하여 전송
      await axios.post(`${API_URL}/posts`, {
        title: newPostData.description.trim(), // description -> title
        picture: newPostData.imageUrl.trim() || null, // imageUrl -> picture
        user_id: TEMP_USER_ID, // 임시 사용자 ID 사용
      });
      fetchPosts(); // 목록 새로고침
      setIsPostModalOpen(false); // 모달 닫기
      setNewPostData({ username: '익명의 사용자', imageUrl: '', description: '' });
      setError('');
    } catch (err) {
      setError('게시글 작성에 실패했습니다.');
      console.error(err);
    }
  };

  // 게시글 수정 (PUT /posts/{id})
  const handleEdit = async (postToEdit) => {
    const newTitle = prompt("게시글 설명을 수정하세요:", postToEdit.title);
    if (newTitle === null) return;
    
    const newPicture = prompt("이미지 URL을 수정하세요 (선택 사항):", postToEdit.picture || "");

    try {
      await axios.put(`${API_URL}/posts/${postToEdit.id}`, {
        title: newTitle.trim(),
        picture: newPicture.trim() || null,
        user_id: TEMP_USER_ID
      });
      fetchPosts(); // 목록 새로고침
      setError('');
    } catch (err) {
      setError('게시글 수정에 실패했습니다.');
      console.error(err);
    }
  };


  // 게시글 삭제 (DELETE /posts/{id})
  const handleDelete = async () => {
    if (!selectedPost) return;

    try {
      await axios.delete(`${API_URL}/posts/${selectedPost.id}`);
      fetchPosts(); // 목록 새로고침
      setIsConfirmModalOpen(false); // 모달 닫기
      setSelectedPost(null);
      setError('');
    } catch (err) {
      setError('게시글 삭제에 실패했습니다.');
      console.error(err);
    }
  };


  // ------------------------------------
  // 2. 초기 로드 및 핸들러
  // ------------------------------------

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenPostModal = () => {
    setNewPostData({ username: '익명의 사용자', imageUrl: '', description: '' });
    setError('');
    setIsPostModalOpen(true);
  };

  const handleOpenConfirmModal = (post) => {
    setSelectedPost(post);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedPost(null);
  };

  // ------------------------------------
  // 3. 컴포넌트
  // ------------------------------------

  const PostItem = ({ post }) => {
    // 임시 사용자 ID 비교 로직
    const isAuthor = post.user_id === TEMP_USER_ID; 

    // Date 객체로 변환
    const createdAtDate = new Date(post.created_at);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md md:max-w-lg transition-transform transform hover:scale-[1.01] duration-300">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <span className="text-sm font-semibold text-gray-700">작성자: {post.user_id === TEMP_USER_ID ? "나 (TEMP_USER_1)" : `사용자 ID: ${post.user_id}`}</span>
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
              className="w-full h-96 object-cover" // 400x400px 대신 Tailwind h-96 (약 384px) 사용
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
      
      {/* Header (왼쪽 정렬) */}
      <header className="w-full bg-white shadow-md py-4 px-6 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-gray-800 text-left">게시판</h1>
          <nav className="flex space-x-4 text-left">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">게시판</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">로그인</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">회원가입</a>
          </nav>
        </div>
        <button 
          onClick={handleOpenPostModal} 
          className="bg-blue-600 text-white py-2 px-4 rounded-full font-semibold shadow-md hover:bg-blue-700 transition-colors text-sm"
        >
          게시글 작성
        </button>
      </header>

      {/* 에러 메시지 */}
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
              // 1열로 내림차순 정렬된 게시글 목록
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

      {/* Create Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative transform transition-all duration-300 scale-100">
            <button onClick={() => setIsPostModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">새 게시글 작성</h2>
            <form onSubmit={createPost} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-gray-700 font-medium mb-1">작성자 (표시용)</label>
                <input type="text" id="username" value={newPostData.username} onChange={e => setNewPostData({...newPostData, username: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="익명의 사용자"/>
              </div>
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

      {/* Custom Confirmation Modal */}
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
    </div>
  );
}
