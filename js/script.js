const PUBLIC_KEY = '5ac7f43a9d05c11e4e3d48fe82e21a80',
    PRIV_KEY = 'abd825dab70aeff64b82abd6c583f07d602e4f9b',
    URL = 'https://gateway.marvel.com:443/v1/public/comics',
    ts = Date.now(),
    hash = CryptoJS.MD5(ts + PRIV_KEY + PUBLIC_KEY).toString();

const headerSearchForm = document.querySelector('#header__search-form'),
    searchResultsList = document.querySelector('#search-results__list'),
    favouriteList = document.querySelector('#favourite__list'),
    modal = document.querySelector('.modal'),
    modalPoster = modal.querySelector('.modal__poster'),
    modalTitle = modal.querySelector('.modal__title'),
    modalCreators = modal.querySelector('.modal__creators'),
    modalDescription = modal.querySelector('.modal__description');

const preloader = document.createElement('div');
preloader.classList.add('lds-dual-ring');

let storage = localStorage.getItem('storageItems'),
    storageItems;

const loadStorage = () => {
    if (storage) {
        storageItems = JSON.parse(storage);
        storageItems.forEach( item => favouriteListComicMaker(item) );
    } else {
        storageItems = [];
    }
}

const DataService = class {
    getData = async url => {
        const data = ( await fetch(url) ).json();
        return data.then(data => data.data.results);
    }

    getComicDetails = id => {
        return this.getData(`${URL}/${id}?ts=${ts}&apikey=${PUBLIC_KEY}&hash=${hash}`);
    }

    getSearchResult = query => {
        return this.getData(`${URL}?title=${query}&ts=${ts}&apikey=${PUBLIC_KEY}&hash=${hash}`);
    }
}

const showSearchResult = data => {
    let out = '';

    if (data.length) {
        data.forEach(item => {
            const { id, title, images } = item;
    
            let className, btnText;
    
            if ( storageItems.some(item => item.id == id) ) {
                className = 'fav-comic-btn';
                btnText = 'Favourite';
            } else {
                className = '';
                btnText = 'Add to Favourite';
            }
    
            const imgPath = images[0].path,
                extension = images[0].extension;
    
            out += `<li class="search-results__item" id="sc${id}">
                        <figure>
                            <img 
                                class="search-results__poster" 
                                src=${imgPath}.${extension} 
                                alt="poster" 
                                width="300"
                            >
                            <figcaption class="search-results__title">${title}</figcaption>
                            <button 
                                class="search-results__btn ${className}">
                                ${btnText}
                            </button>
                        </figure>
                    </li>`;
        });
    } else {
        out = 'No Results Found';
    }

    searchResultsList.insertAdjacentHTML('beforeend', out);
    preloader.remove();
}

const showDetailsModal = data => {
    let { title, images, description, creators } = data[0];

    if (!description) description = 'Not Found';
    let comicCreators = '';

    if (creators.items.length) {
        creators.items.forEach((item, i) => {
            if (i < 4) {
                comicCreators += `<p><i>${item.name}</i> - ${item.role}</p>`;
            }
        });
    } else {
        comicCreators = 'Not Found';
    }

    const imgPath = images[0].path,
        extension = images[0].extension;

    modalPoster.src = `${imgPath}.${extension}`;
    modalTitle.textContent = title;
    modalCreators.innerHTML = comicCreators;
    modalDescription.innerHTML = description;

    modal.classList.remove('hide');
}

const closeModal = () => {
    modalCreators.innerHTML = '';

    modal.classList.add('hide');
};

const favouriteListComicMaker = ({ id, title }) => {
    const out = `<li class="favourite__list-item" id=fc${id}>
                    <p class="favourite__list-title">${title}</p>
                    <i class="fas fa-times-circle"></i>
                </li>`;

    favouriteList.insertAdjacentHTML('beforeend', out);
}

const addToFavourite = comicObj => {
    storageItems.push(comicObj);
    localStorage.setItem( 'storageItems', JSON.stringify(storageItems) );

    favouriteListComicMaker(comicObj);
}

const removeFromFavourite = (comic, id) => {
    storageItems = storageItems.filter(item => item.id !== id);
    localStorage.setItem( 'storageItems', JSON.stringify(storageItems) );

    if ( searchResultsList.querySelector(`#sc${id}`) ) {
        const searchResultComic = searchResultsList.querySelector(`#sc${id}`),
            searchResultBtn = searchResultComic.querySelector('.fav-comic-btn');

        searchResultBtn.classList.remove('fav-comic-btn');
        searchResultBtn.textContent = 'Add to Favourite';
    }

    comic.remove();
}

headerSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    searchResultsList.innerHTML = '';
    
    const query = this.elements.search.value
        .trim().split(' ').join('%20');

    if (query) {
        new DataService().getSearchResult(query).then(showSearchResult);
    }

    searchResultsList.append(preloader);
});

searchResultsList.addEventListener('click', e => {
    const target = e.target,
        comic = target.closest('.search-results__item'),
        id = comic.id.slice(2);

    if (target.matches('.search-results__btn') &&
        !target.matches('.fav-comic-btn')) {
        const btn = target.closest('.search-results__btn');

        btn.textContent = 'Favourite';
        btn.classList.add('fav-comic-btn');
    
        const title = comic.querySelector('.search-results__title').textContent,
            comicObj = { id, title };
    
        addToFavourite(comicObj);
    } 

    if (target.matches('.search-results__poster')) {
        new DataService().getComicDetails(id).then(showDetailsModal);
    }
});

favouriteList.addEventListener('click', e => {
    const target = e.target,
        comic = target.closest('.favourite__list-item'),
        id = comic.id.slice(2);

    if (target.matches('.fa-times-circle')) {
        removeFromFavourite(comic, id);
    } 

    if (target.matches('.favourite__list-title')) {
        new DataService().getComicDetails(id).then(showDetailsModal);
    }
});

modal.addEventListener('click', e => {
    const target = e.target,
        closeBtn = target.closest('.fa-times'),
        background = target.matches('.modal');

    if (closeBtn || background) {
        closeModal();
    }
});

loadStorage();