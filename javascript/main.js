// 圖片路徑陣列
const images = [
    "images/building.jpg",
    "images/basketball.jpg",
    "images/badminton.jpg",
    "images/table.jpg"
];

let currentIndex = 0; // 當前圖片索引

// 獲取圖片元素
const slideshowImage = document.querySelector(".slideshow-image");

// 顯示當前圖片
function showImage(index) {
    slideshowImage.src = images[index];  // 設置圖片來源
}

// 自動輪播功能，每3秒切換一次圖片
function autoPlay() {
    currentIndex = (currentIndex + 1) % images.length; // 循環回到第一張圖片
    showImage(currentIndex);
}

// 初始化顯示第一張圖片
showImage(currentIndex);

// 啟動自動輪播
setInterval(autoPlay, 3000);


console.log("Script loaded");
