const clientId = "446fc9be";

const apiUrl = "https://api.jamendo.com/v3.0/tracks/";
const audioPlayer = document.getElementById("audioPlayer");

const musicGrid = document.getElementById("musicGrid");
const favoritesGrid = document.getElementById("favoritesGrid");
const statusMessage = document.getElementById("statusMessage");
const favoritesEmpty = document.getElementById("favoritesEmpty");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const refreshButton = document.getElementById("refreshButton");
const exploreButton = document.getElementById("exploreButton");

const playButton = document.getElementById("playButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const progressBar = document.getElementById("progressBar");
const volumeBar = document.getElementById("volumeBar");

const playerCover = document.getElementById("playerCover");
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playerFavorite = document.getElementById("playerFavorite");

let tracks = [];
let currentTrackIndex = -1;
let currentSearch = "";

let favoriteIds = new Set(
    JSON.parse(localStorage.getItem("crzspyFavorites") || "[]")
);

// Định dạng s => m
function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Ngăn nội dung văn bản từ API trở thành HTML ngoài ý muốn
function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Lưu danh sách yêu thích trên trình duyệt
function saveFavorites() {
    localStorage.setItem(
        "crzspyFavorites",
        JSON.stringify([...favoriteIds])
    );
}

// Tạo URL API
function createApiUrl(search = "") {
    const params = new URLSearchParams({
        client_id: clientId,
        format: "json",
        limit: "24",
        order: "popularity_total",
        audioformat: "mp32",
        include: "licenses"
    });

    if (search.trim()) {
        params.set("search", search.trim());
    }

    return `${apiUrl}?${params.toString()}`;
}

// Tải danh sách bài hát từ Jamendo
async function loadTracks(search = "") {
    currentSearch = search;
    statusMessage.textContent = "Đang tải bài hát...";
    musicGrid.innerHTML = "";

    if (
        !clientId ||
        clientId === ""
    ) {
        statusMessage.innerHTML =
            'Bạn cần thêm Client ID. ' +
            '<a href="https://devportal.jamendo.com/" target="_blank" rel="noopener noreferrer">' +
            'Đăng ký Jamendo API</a> rồi nhập ID vào app.js.';

        return;
    }

    try {
        const response = await fetch(createApiUrl(search));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.headers?.status !== "success") {
            throw new Error(
                data.headers?.error_message || "API trả về lỗi."
            );
        }

        tracks = (data.results || []).filter(
            track => track.audio && track.id
        );

        renderTracks(tracks);
        renderFavorites();

        statusMessage.textContent = tracks.length
            ? `Tìm thấy ${tracks.length} bài hát.`
            : "Không tìm thấy bài hát có đường dẫn âm thanh. Hãy thử từ khóa khác.";

    } catch (error) {
        console.error("Lỗi tải nhạc:", error);

        statusMessage.textContent =
            "Không thể tải nhạc. Hãy kiểm tra Client ID, " +
            "kết nối mạng và thử chạy website bằng Live Server.";
    }
}

// Hiển thị các thẻ nhạc
function renderTracks(list) {
    musicGrid.innerHTML = "";

    list.forEach(track => {
        const card = document.createElement("article");
        card.className = "music-card";

        const isFavorite = favoriteIds.has(String(track.id));

        card.innerHTML = `
            <div class="cover-wrap">
                <img
                    src="${escapeHtml(track.image || "")}"
                    alt="Ảnh bìa ${escapeHtml(track.name)}"
                    loading="lazy"
                >
                <button
                    class="card-play"
                    data-action="play"
                    data-id="${escapeHtml(track.id)}"
                    aria-label="Phát ${escapeHtml(track.name)}"
                >▶</button>
            </div>

            <div class="card-details">
                <h3 title="${escapeHtml(track.name)}">
                    ${escapeHtml(track.name)}
                </h3>

                <p title="${escapeHtml(track.artist_name)}">
                    ${escapeHtml(track.artist_name)}
                </p>

                <div class="card-bottom">
                    <span class="duration-label">
                        ${formatTime(Number(track.duration))}
                    </span>

                    <button
                        class="icon-button ${isFavorite ? "is-favorite" : ""}"
                        data-action="favorite"
                        data-id="${escapeHtml(track.id)}"
                        aria-label="Yêu thích ${escapeHtml(track.name)}"
                    >${isFavorite ? "♥" : "♡"}</button>
                </div>
            </div>
        `;

        musicGrid.appendChild(card);
    });
}

// Tìm bài hát theo ID
function findTrackById(id) {
    return tracks.find(track => String(track.id) === String(id));
}

// Phát một bài hát
async function playTrack(track) {
    if (!track || !track.audio) {
        statusMessage.textContent =
            "Bài hát này không có đường dẫn phát hợp lệ.";
        return;
    }

    const index = tracks.findIndex(
        item => String(item.id) === String(track.id)
    );

    if (index !== -1) {
        currentTrackIndex = index;
    }

    audioPlayer.src = track.audio;
    audioPlayer.volume = Number(volumeBar.value);

    playerTitle.textContent = track.name || "Không rõ tên";
    playerArtist.textContent = track.artist_name || "Không rõ nghệ sĩ";
    playerCover.src = track.image ||
        "https://placehold.co/100x100/111111/39ff88?text=C";

    playerCover.onerror = () => {
        playerCover.src =
            "https://placehold.co/100x100/111111/39ff88?text=C";
    };

    updatePlayerFavorite();

    try {
        await audioPlayer.play();
        playButton.textContent = "||";
        playButton.setAttribute("aria-label", "Tạm dừng");
    } catch (error) {
        console.error("Không thể phát bài hát:", error);

        playButton.textContent = "▶";
        statusMessage.textContent =
            "Trình duyệt không phát được bài hát này. " +
            "Hãy thử bài khác hoặc kiểm tra đường dẫn âm thanh.";
    }
}

// Phát hoặc tạm dừng
async function togglePlay() {
    if (audioPlayer.paused) {
        if (!audioPlayer.src) {
            if (tracks.length) {
                await playTrack(tracks[0]);
            } else {
                statusMessage.textContent =
                    "Hãy tải danh sách nhạc trước.";
            }
            return;
        }

        try {
            await audioPlayer.play();
        } catch (error) {
            console.error(error);
            statusMessage.textContent =
                "Không thể phát nhạc. Hãy thử chọn một bài khác.";
        }
    } else {
        audioPlayer.pause();
    }
}

// Phát bài tiếp theo hoặc bài trước
function changeTrack(direction) {
    if (!tracks.length) return;

    let nextIndex;

    if (currentTrackIndex < 0) {
        nextIndex = 0;
    } else {
        nextIndex =
            (currentTrackIndex + direction + tracks.length) %
            tracks.length;
    }

    playTrack(tracks[nextIndex]);
}

// Cập nhật giao diện nút yêu thích
function updatePlayerFavorite() {
    const currentTrack = tracks[currentTrackIndex];

    const isFavorite = currentTrack &&
        favoriteIds.has(String(currentTrack.id));

    playerFavorite.textContent = isFavorite ? "♥" : "♡";
    playerFavorite.classList.toggle("is-favorite", Boolean(isFavorite));
}

// Thêm hoặc xóa bài hát yêu thích
function toggleFavorite(id) {
    const key = String(id);

    if (favoriteIds.has(key)) {
        favoriteIds.delete(key);
    } else {
        favoriteIds.add(key);
    }

    saveFavorites();
    renderTracks(tracks);
    renderFavorites();
    updatePlayerFavorite();
}

// Hiển thị danh sách yêu thích
function renderFavorites() {
    favoritesGrid.innerHTML = "";

    const favorites = tracks.filter(track =>
        favoriteIds.has(String(track.id))
    );

    favoritesEmpty.textContent = favorites.length
        ? ""
        : "Bấm biểu tượng ♡ để lưu bài hát yêu thích.";

    favorites.forEach(track => {
        const card = document.createElement("article");
        card.className = "music-card";

        card.innerHTML = `
            <div class="cover-wrap">
                <img
                    src="${escapeHtml(track.image || "")}"
                    alt="Ảnh bìa ${escapeHtml(track.name)}"
                    loading="lazy"
                >
                <button
                    class="card-play"
                    data-action="play"
                    data-id="${escapeHtml(track.id)}"
                    aria-label="Phát ${escapeHtml(track.name)}"
                >▶</button>
            </div>

            <div class="card-details">
                <h3>${escapeHtml(track.name)}</h3>
                <p>${escapeHtml(track.artist_name)}</p>
                <div class="card-bottom">
                    <span class="duration-label">
                        ${formatTime(Number(track.duration))}
                    </span>
                    <button
                        class="icon-button is-favorite"
                        data-action="favorite"
                        data-id="${escapeHtml(track.id)}"
                        aria-label="Xóa khỏi yêu thích"
                    >♥</button>
                </div>
            </div>
        `;

        favoritesGrid.appendChild(card);
    });
}

// Bắt sự kiện trên danh sách bài hát
document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;    
    const { action, id } = button.dataset;  
    if (action === "play") {
        const track = findTrackById(id);    
        if (track) {
            playTrack(track);
        }
    }   
    if (action === "favorite") {
        toggleFavorite(id);
    }
});

// Tìm kiếm
function searchTracks() {
    loadTracks(searchInput.value.trim());
}

searchButton.addEventListener("click", searchTracks);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchTracks();
    }
});

// Các nút điều khiển
playButton.addEventListener("click", togglePlay);

previousButton.addEventListener("click", () => {
    changeTrack(-1);
});

nextButton.addEventListener("click", () => {
    changeTrack(1);
});

refreshButton.addEventListener("click", () => {
    searchInput.value = "";
    loadTracks();
});

exploreButton.addEventListener("click", () => {
    document.getElementById("library").scrollIntoView({
        behavior: "smooth"
    });
});

playerFavorite.addEventListener("click", () => {
    const track = tracks[currentTrackIndex];

    if (track) {
        toggleFavorite(track.id);
    }
});

// Cập nhật thanh tiến độ
audioPlayer.addEventListener("timeupdate", () => {
    const duration = audioPlayer.duration;

    if (Number.isFinite(duration) && duration > 0) {
        progressBar.value =
            (audioPlayer.currentTime / duration) * 100;
    } else {
        progressBar.value = 0;
    }

    document.getElementById("currentTime").textContent =
        formatTime(audioPlayer.currentTime);

    document.getElementById("duration").textContent =
        formatTime(duration);
});

// Kéo thanh tiến độ để tua
progressBar.addEventListener("input", () => {
    const duration = audioPlayer.duration;

    if (Number.isFinite(duration) && duration > 0) {
        audioPlayer.currentTime =
            (Number(progressBar.value) / 100) * duration;
    }
});

// Điều chỉnh âm lượng
volumeBar.addEventListener("input", () => {
    audioPlayer.volume = Number(volumeBar.value);
});

// Đồng bộ nút phát/tạm dừng
audioPlayer.addEventListener("play", () => {
    playButton.textContent = "||";
    playButton.setAttribute("aria-label", "Tạm dừng");
});

audioPlayer.addEventListener("pause", () => {
    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "Phát nhạc");
});

// Tự chuyển bài khi phát xong
audioPlayer.addEventListener("ended", () => {
    changeTrack(1);
});

audioPlayer.addEventListener("error", () => {
    playButton.textContent = "▶";
});

// Tải danh sách khi mở trang
loadTracks();