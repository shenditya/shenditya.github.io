/*!
* Copyright 2024 Shendy Aditya S
*/ 



// JSON data representing portfolio items and modals
const portfolioData = [
    {
        "id": 1,
        "modalId": "portfolioModal1",
        "title": "JakLingko SuperApp",
        "imgSrc": "assets/img/portfolio/jaklingko1.png",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, RxSwift, Moya, CoreNFC, UIKit, MVVM.</p> <p>PT. JakLingko Indonesia.</p>",
        "images": [
            "assets/img/portfolio/jaklingko1.png",
            "assets/img/portfolio/jaklingko2.png"
        ]
    },
    {
        "id": 2,
        "modalId": "portfolioModal2",
        "title": "mCampus",
        "imgSrc": "assets/img/portfolio/mcampus1.png",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, RxSwift, Moya, UIKit, MVVM.</p> <p> PT. Solusi Kampus Indonesia.</p>",
        "images": [
            "assets/img/portfolio/mcampus1.png",
            "assets/img/portfolio/mcampus2.png"
        ]
    },
    {
        "id": 3,
        "modalId": "portfolioModal3",
        "title": "Safe Travel ",
        "imgSrc": "assets/img/portfolio/safetravel1.png",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, UIKit, MVC.</p> <p> MINISTRY OF FOREIGN AFFAIRS OF THE REPUBLIC OF INDONESIA.</p>",
        "images": [
            "assets/img/portfolio/safetravel1.png",
            "assets/img/portfolio/safetravel2.png",
            "assets/img/portfolio/safetravel3.png"
        ]
    },
    {
        "id": 4,
        "modalId": "portfolioModal4",
        "title": "Solo Destination",
        "imgSrc": "assets/img/portfolio/soldes1.png",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, UIKit, MVC.</p> <p>  Dinas Komunikasi, Informatika, Statistik dan Persandian Kota Surakarta.</p>",
        "images": [
            "assets/img/portfolio/soldes1.png",
            "assets/img/portfolio/soldes2.png",
            "assets/img/portfolio/soldes3.png",
        ]
    },
    {
        "id": 5,
        "modalId": "portfolioModal5",
        "title": "Jogja Istimewa",
        "imgSrc": "assets/img/portfolio/jogjis.jpeg",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, UIKit, MVC.</p> <p> Pemerintah Daerah Istimewa Yogyakarta.</p>",
        "images": [
            "assets/img/portfolio/jogjis.jpeg"
        ]
    },
    {
        "id": 6,
        "modalId": "portfolioModal6",
        "title": "PIHPS Harga Pangan",
        "imgSrc": "assets/img/portfolio/pihps.jpeg",
        "text": "<p><b>Language &amp; Technology:</b> Swift, REST, UIKit, MVC.</p> <p> Central Bank of Indonesia.</p>",
        "images": [
            "assets/img/portfolio/pihps.jpeg"
        ]
    }
];

// Function to dynamically generate portfolio items
function generatePortfolioItems() {
    const portfolioContainer = document.getElementById("portfolioContainer");

    portfolioData.forEach(item => {
        const portfolioItem = document.createElement("div");
        portfolioItem.className = "col-md-6 col-lg-4 mb-5";

        portfolioItem.innerHTML = `
            <div class="portfolio-item mx-auto" data-bs-toggle="modal" data-bs-target="#${item.modalId}">
                <div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100">
                    <div class="portfolio-item-caption-content text-center text-white">
                    <i class="fas fa-search fa-3x"></i>
                    </div>
                </div>
                <img class="img-fluid" src="${item.imgSrc}" alt="Portfolio Item ${item.id}" />
            </div>
        `;

        portfolioContainer.appendChild(portfolioItem);
    });
}

// Function to dynamically generate portfolio modals
function generatePortfolioModals() {
    const portfolioModalsContainer = document.getElementById("portfolioModalsContainer");

    portfolioData.forEach(item => {
        const portfolioModal = document.createElement("div");
        portfolioModal.className = "portfolio-modal modal fade";
        portfolioModal.id = item.modalId;
        portfolioModal.tabIndex = -1;
        portfolioModal.setAttribute("aria-labelledby", item.modalId);
        portfolioModal.setAttribute("aria-hidden", "true");

        const imagesHtml = item.images.map(image => `<img class="img-fluid rounded mb-3" src="${image}" alt="${item.title}" />`).join("");

        portfolioModal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header border-0"><button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button></div>
                    <div class="modal-body text-center pb-5">
                        <div class="container">
                            <div class="row justify-content-center">
                                <div class="col-lg-8">
                                    <h2 class="portfolio-modal-title text-secondary text-uppercase mb-0">${item.title}</h2>
                                    <div class="divider-custom">
                                        <div class="divider-custom-line"></div>
                                        <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
                                        <div class="divider-custom-line"></div>
                                    </div>
                                    ${imagesHtml}
                                    <p class="mb-4">${item.text}</p>
                                    <button class="btn btn-primary" data-bs-dismiss="modal">
                                        <i class="fas fa-xmark fa-fw"></i>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        portfolioModalsContainer.appendChild(portfolioModal);
    });
}


function createCircles(numberOfCircles) {
    const circlesContainer = document.getElementById('circles');
    for (let i = 0; i < numberOfCircles; i++) {
      const li = document.createElement('li');
      circlesContainer.appendChild(li);
    }
  }

 

// Call the functions to generate portfolio items and modals when the page loads
window.onload = function () {
    generatePortfolioItems();
    generatePortfolioModals();
    createCircles(10);
};
