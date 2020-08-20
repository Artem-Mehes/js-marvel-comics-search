const PUBLIC_KEY = '5ac7f43a9d05c11e4e3d48fe82e21a80',
    PRIV_KEY = 'abd825dab70aeff64b82abd6c583f07d602e4f9b',
    URL = 'https://gateway.marvel.com:443/v1/public/comics?',
    ts = Date.now(),
    hash = CryptoJS.MD5(ts + PRIV_KEY + PUBLIC_KEY).toString();

const headerSearchForm = document.querySelector('#header__search-form'),
    searchResultsList = document.querySelector('#search-results__list'),
    readingList = document.querySelector('#reading__list');

let storage = localStorage.getItem('comicsList'),
    comicsList;

const DataService = class {
    getData = async url => {
        const data = ( await fetch(url) ).json();
        return data.then(data => data.data.results);
    }

    getSearchResult = query => {
        return this.getData(`${URL}title=${query}&ts=${ts}&apikey=${PUBLIC_KEY}&hash=${hash}`);
    }
}

const comicMaker = data => {
    data.forEach(item => {
        const { id, title, images } = item;

        const imgPath = images[0].path,
            extension = images[0].extension;

        const out = `<li class="search-results__item" id="${id}">
                        <figure>
                            <img 
                                class="search-results__poster" 
                                src=${imgPath}.${extension} 
                                alt="poster" 
                                width="300"
                            >
                            <figcaption class="search-results__title">${title}</figcaption>
                            <button 
                                class="search-results__btn">
                                Add to Reading List
                            </button>
                        </figure>
                    </li>`;

        searchResultsList.insertAdjacentHTML('beforeend', out);
    });
}

const readingListComicMaker = ({ id, title }) => {
    const out = `<li class="reading__list-item" id=${id}>
                    <p>${title}</p>
                </li>`;

    readingList.insertAdjacentHTML('beforeend', out);
}

const loadComics = data => {
    data.forEach( item => readingListComicMaker(item) );
}

if (storage) {
    comicsList = JSON.parse(storage);
    loadComics(comicsList);
} else {
    comicsList = [];
}

headerSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    searchResultsList.innerHTML = '';
    
    const query = this.elements.search.value
        .trim().split(' ').join('%20');

    if (query) {
        new DataService().getSearchResult(query).then(comicMaker);
    }
});

searchResultsList.addEventListener('click', e => {
    const target = e.target,
        btn = target.closest('.search-results__btn');

    if (!btn) return;

    const comic = btn.closest('.search-results__item'),
        comicId = comic.id,
        comicTitle = comic.querySelector('.search-results__title').textContent;

    comicsList.push({ id: comicId, title: comicTitle });
    localStorage.setItem( 'comicsList', JSON.stringify(comicsList) );

    readingListComicMaker({ id: comicId, title: comicTitle });
});