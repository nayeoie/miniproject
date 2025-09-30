Idol Board Backend
아이돌 덕질 게시판 프로젝트의 백엔드 서버입니다.
FastAPI와 MySQL을 사용하여 회원(User)과 게시글(Post)을 관리합니다.

# 주요 파일
main.py → FastAPI 서버 실행, 엔드포인트 정의
models.py → User / Post 모델 정의
database.py → DB 연결 및 세션 관리

# main.py -> main.py는 서버 실행 + API 라우팅 역할을 담당합니다.
<주요내용>
1. 앱 초기화
app = FastAPI(
    title="Idol Board API",
    description="아이돌 덕질 게시판 백엔드",
    version="1.0.0"
)
2. CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 모든 출처 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
3. 엔드포인트 설정
/ : 서버 동작 확인 메시지 반환.
/users (POST) : 회원가입 (이메일 중복 체크 포함).
/users (GET) : 모든 회원 조회.
/posts (POST) : 게시글 작성 (user_id 검증).
/posts (GET) : 모든 게시글 조회.

# models.py -> DB의 **테이블 스키마(구조)**를 코드로 정의하는 곳입니다
<주요내용>
1. User table
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
2. Post table
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    picture = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

# database.py -> DB와의 연결 세팅 + 세션 관리를 하는 핵심 파일입니다.
1. DB 연결 
2. 엔진 생성
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True, pool_recycle=300)
3. 세션팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
4. Base 클래스
Base = declarative_base()
5. 의존성 주입용 get_db
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



