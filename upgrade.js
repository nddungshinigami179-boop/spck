// cau truc IFFE(tranh trung bien global)
(() => {
    //Upgrade
    const storageKeys = {
        playlists: "crzspyPlaylists",
        history: "crzspyHistory"
    };

    const readStorage = (key, fallback) => {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    };

    let playlists = readStorage(storageKeys.playlists, {});
    let history = readStorage(storageKeys.history, []);
    let shuffleEnabled = false;
    let repeatMode = "off"; // off | all | one

    // playlist
    const playlistSelect = document.getElementById("playlistSelect");
    const playlistTracks = document.getElementById("playlistTracks");
    const playlistMessage = document.getElementById("playlistMessage");
    const savePlaylists = () => {
        localStorage.setItem(storageKeys.playlists, JSON.stringify(playlists));
    };
    // track da nghe
    const historyTracks = document.getElementById("historyTracks");
    const historyEmpty = document.getElementById("historyEmpty");
    const saveHistory = () => {
        localStorage.setItem(storageKeys.history, JSON.stringify(history));
    };

    // nut bo sung
    const shuffleButton = document.getElementById("shuffleButton");
    const repeatButton = document.getElementById("repeatButton");
 
    const getCurrentTrack = () => tracks[currentTrackIndex] || null;

    // Đồng bộ danh sách playlist vào menu
    function renderPlaylistOptions() {
        const selected = playlistSelect.value;

        playlistSelect.innerHTML =
            '<option value="">Chọn playlist</option>';

        Object.keys(playlists).forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            playlistSelect.appendChild(option);
        });

        if (Object.hasOwn(playlists, selected)) {
            playlistSelect.value = selected;
        }
    }

    // Dùng chung giao diện thẻ nhạc cho playlist và lịch sử
    function renderTrackCollection(container, list, emptyText) {
        container.innerHTML = "";

        list.forEach(track => {
            const card = document.createElement("article");
            card.className = "music-card";

            card.innerHTML = `
                <div class="cover-wrap">
                    <img
                        src="${escapeHtml(track.image || "")}"
                        alt="${escapeHtml(track.name || "Bài hát")}"
                        loading="lazy"
                    >
                    <button
                        class="card-play"
                        data-upgrade-action="play"
                        data-id="${escapeHtml(track.id)}"
                        aria-label="Phát bài hát"
                    >▶</button>
                </div>
                <div class="card-details">
                    <h3>${escapeHtml(track.name || "Bài hát")}</h3>
                    <p>${escapeHtml(track.artist_name || "Nghệ sĩ")}</p>
                    <div class="card-bottom">
                        <span class="duration-label">
                            ${formatTime(Number(track.duration))}
                        </span>
                        <button
                            class="icon-button"
                            data-upgrade-action="remove"
                            data-id="${escapeHtml(track.id)}"
                            aria-label="Xóa bài hát khỏi danh sách"
                        >×</button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        if (list.length === 0 && emptyText) {
            const empty = document.createElement("p");
            empty.className = "empty-message";
            empty.textContent = emptyText;
            container.appendChild(empty);
        }
    }

    function renderSelectedPlaylist() {
        const name = playlistSelect.value;
        const list = playlists[name] || [];

        renderTrackCollection(
            playlistTracks,
            list,
            name ? "Playlist này chưa có bài hát." : "Hãy chọn hoặc tạo playlist."
        );
    }

    function renderHistory() {
        renderTrackCollection(historyTracks, history, "");

        historyEmpty.textContent = history.length
            ? ""
            : "Những bài hát bạn phát sẽ xuất hiện tại đây.";
    }

    // Tạo playlist mới
    document.getElementById("createPlaylistButton")
        .addEventListener("click", () => {
            const name = prompt("Nhập tên playlist mới:");
            if (name === null) return;
            const cleanName = name.trim();

            if (!cleanName) {
                playlistMessage.textContent = "Tên playlist không được để trống.";
                return;
            }

            if (Object.hasOwn(playlists, cleanName)) {
                playlistMessage.textContent = "Tên playlist đã tồn tại.";
                return;
            }

            playlists[cleanName] = [];
            savePlaylists();
            renderPlaylistOptions();

            playlistSelect.value = cleanName;
            renderSelectedPlaylist();

            playlistMessage.textContent = `Đã tạo playlist "${cleanName}".`;
        });

    playlistSelect.addEventListener("change", renderSelectedPlaylist);

    // Thêm bài đang phát vào playlist
    document.getElementById("addToPlaylistButton")
        .addEventListener("click", () => {
            const name = playlistSelect.value;
            const track = getCurrentTrack();

            if (!name || !Object.hasOwn(playlists, name)) {
                playlistMessage.textContent = "Hãy chọn một playlist trước.";
                return;
            }

            if (!track) {
                playlistMessage.textContent = "Hãy phát một bài hát trước.";
                return;
            }

            const alreadyExists = playlists[name].some(
                item => String(item.id) === String(track.id)
            );

            if (alreadyExists) {
                playlistMessage.textContent =
                    "Bài hát này đã có trong playlist.";
                return;
            }

            playlists[name].push(track);
            savePlaylists();
            renderSelectedPlaylist();

            playlistMessage.textContent = "Đã thêm bài hát vào playlist.";
        });

    // Xóa playlist đang chọn
    document.getElementById("deletePlaylistButton").addEventListener("click", () => {
        const name = playlistSelect.value;

        if (!name || !Object.hasOwn(playlists, name)) {
            playlistMessage.textContent = "Hãy chọn playlist cần xóa.";
            return;
        }

        if (!confirm(`Bạn có muốn xóa playlist "${name}" không?`)) {
            return;
        }

        delete playlists[name];
        savePlaylists();
        renderPlaylistOptions();
        renderSelectedPlaylist();

        playlistMessage.textContent = "Đã xóa playlist.";
    });

    // Phát bài hát từ playlist hoặc lịch sử
    function playStoredTrack(id) {
        const track = [...tracks, ...history,
            ...Object.values(playlists).flat()]
            .find(item => String(item.id) === String(id));

        if (!track) return;

        // Đảm bảo bài hát nằm trong danh sách để điều khiển bài trước/sau
        let index = tracks.findIndex(
            item => String(item.id) === String(track.id)
        );

        if (index === -1) {
            tracks.push(track);
            index = tracks.length - 1;
        }

        playTrack(tracks[index]);
    }

    // Xóa bài hát khỏi playlist hoặc lịch sử
    document.addEventListener("click", event => {
        const button = event.target.closest(
            "button[data-upgrade-action]"
        );

        if (!button) return;

        const action = button.dataset.upgradeAction;
        const id = button.dataset.id;

        if (action === "play") {
            playStoredTrack(id);
        }

        if (action === "remove") {
            const name = playlistSelect.value;

            if (name && Object.hasOwn(playlists, name)) {
                playlists[name] = playlists[name].filter(
                    item => String(item.id) !== String(id)
                );

                savePlaylists();
                renderSelectedPlaylist();
            }
        }
    });

    // Lưu lịch sử mỗi khi bài hát bắt đầu phát
    audioPlayer.addEventListener("play", () => {
        const track = getCurrentTrack();

        if (!track) return;

        history = [
            track,
            ...history.filter(
                item => String(item.id) !== String(track.id)
            )
        ].slice(0, 30);

        saveHistory();
        renderHistory();
    });

    // Xóa lịch sử nghe
    document.getElementById("clearHistoryButton")
        .addEventListener("click", () => {
            if (!history.length) return;

            if (!confirm("Bạn có muốn xóa toàn bộ lịch sử nghe?")) {
                return;
            }

            history = [];
            saveHistory();
            renderHistory();
        });

    // Phát ngẫu nhiên
    shuffleButton.addEventListener("click", () => {
        shuffleEnabled = !shuffleEnabled;

        shuffleButton.classList.toggle("is-active", shuffleEnabled);
        shuffleButton.setAttribute(
            "aria-label",
            shuffleEnabled
                ? "Tắt phát ngẫu nhiên"
                : "Bật phát ngẫu nhiên"
        );
    });

    // Chuyển đổi chế độ lặp: tắt -> lặp danh sách -> lặp một bài
    repeatButton.addEventListener("click", () => {
        const modes = ["off", "all", "one"];
        repeatMode = modes[
            (modes.indexOf(repeatMode) + 1) % modes.length
        ];

        const labels = {
            off: "↻",
            all: "↻",
            one: "↻¹"
        };

        const descriptions = {
            off: "Lặp: tắt",
            all: "Lặp toàn bộ danh sách",
            one: "Lặp một bài"
        };

        repeatButton.textContent = labels[repeatMode];
        repeatButton.title = descriptions[repeatMode];
        repeatButton.setAttribute("aria-label", descriptions[repeatMode]);
        repeatButton.classList.toggle("is-active", repeatMode !== "off");

        // audio.loop xử lý lặp bài hiện tại
        audioPlayer.loop = repeatMode === "one";
    });

    // Thay cách chuyển bài để hỗ trợ phát ngẫu nhiên
    changeTrack = function(direction) {
        if (!tracks.length) return;

        let nextIndex;

        if (shuffleEnabled && tracks.length > 1) {
            do {
                nextIndex = Math.floor(Math.random() * tracks.length);
            } while (nextIndex === currentTrackIndex);
        } else if (currentTrackIndex < 0) {
            nextIndex = 0;
        } else {
            nextIndex =
                (currentTrackIndex + direction + tracks.length) %
                tracks.length;
        }

        playTrack(tracks[nextIndex]);
    };

    // Phím tắt: Space, mũi tên trái/phải, M
    document.addEventListener("keydown", event => {
        const target = event.target;

        if (
            target.matches("input, textarea, select") ||
            target.isContentEditable ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        ) {
            return;
        }

        if (event.code === "Space") {
            event.preventDefault();
            togglePlay();
        }

        if (event.code === "ArrowRight" && audioPlayer.src) {
            audioPlayer.currentTime = Math.min(
                audioPlayer.currentTime + 5,
                Number.isFinite(audioPlayer.duration)
                    ? audioPlayer.duration
                    : audioPlayer.currentTime + 5
            );
        }

        if (event.code === "ArrowLeft" && audioPlayer.src) {
            audioPlayer.currentTime = Math.max(
                0,
                audioPlayer.currentTime - 5
            );
        }

        if (event.key.toLowerCase() === "m") {
            audioPlayer.muted = !audioPlayer.muted;
        }
    });

    // Khởi tạo dữ liệu đã lưu
    renderPlaylistOptions();
    renderSelectedPlaylist();
    renderHistory();
})();