'use strict';





class Workout{

    date = new Date();
    id = (Date.now() +'').slice(-10);
    constructor(coords,distance,duration){
       this.coords = coords; // [lat,lan]
       this.distance = distance; // in km
       this.duration = duration; // in min
       
    }
    _setDescription(){
        // prettier-ignore
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}  ${this.date.getDate()}`
    }
}

class Running extends Workout{

    type = 'running' ;// avaliable on evry istance of the class

    constructor(coords,distance,duration,cadance){
    super(coords,distance,duration),
    this.cadance = cadance;
    this.calcPace()
    this._setDescription()
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance
        return this.pace
    }
}
class Cycling extends Workout{

    type = 'cycling' // avaliable on evry istance of the class

    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration),
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription()
        }
    calcSpeed(){
       // km/h
       this.speed = this.distance / (this.duration / 60)
       return this.speed
    }
}



// w pracy z klasami trzeba wiele razy łączyć (".bind(this)") event handlery z "this"

//////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App{
    #map;
    #mapEvent;
    #workouts = [];
    constructor(){
        
        this._getPosition(); // to jest po to aby nie musiec ręczenie wywyływać funckji tylko od razu na stracie
        form.addEventListener('submit',this._newWorkout.bind(this))
        inputType.addEventListener('change',this._toggleElevationField)

    }
    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            function(){ // if there is an error
                alert('Could not get Your position')
            })
        }
    }
    _loadMap(position){
        {
            const {latitude} = position.coords;
            const {longitude} = position.coords;
        
            const coords = [latitude,longitude];
            
             this.#map = L.map('map').setView(coords, 15);
        
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
        
            // Handling click on map
            this.#map.on('click',this._showForm.bind(this))
        }
    }
    _showForm(mapEvent){
        this.#mapEvent = mapEvent;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        // empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =  "";
        form.style.display='none'
        form.classList.add('hidden');
        setTimeout(()=>form.style.display='grid',1000)
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _newWorkout(e) {

        const validInputs = (...inputs) => 
            inputs.every(inp => Number.isFinite(inp))

        const allPositive = (...inputs) =>      
            inputs.every(inp => inp > 0)
           

        e.preventDefault();


        // Get Data from th Form

        const type = inputType.value;
        const distance = +inputDistance.value // "+ " converting to number, works as Number()
        const duration = +inputDuration.value
        const {lat,lng} = this.#mapEvent.latlng
        let workout ;


        // Check if data is valid

        // if running --> create running object
        if(type === 'running'){
            
            const cadance = +inputCadence.value;
            // Check if data is valid
            if(
                //!Number.isFinite(distance) ||
                //!Number.isFinite(duration) ||
                //!Number.isFinite(cadance)) 
                !validInputs(distance,duration,cadance) || !allPositive(distance,duration,cadance)
            )
            return alert('Inputs has to be positive Number')
             workout = new Running([lat,lng],distance,duration,cadance)
            
        }

        // if cycling --> create cycling object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration))
                return alert('Inputs has to be positive Number')

              workout = new Cycling([lat,lng],distance,duration,elevation)
        }

        // Add new object to workout Array

        this.#workouts.push(workout)
        console.log(workout)

        // Render workout on map as Marker

       this._renderWorkoutMarker(workout)
             
    
           
        // Render workout on list
        this._renderWorkout(workout)

        // Hdie form + clear the inputs fileds

       this._hideForm()
        
       
    }

    _renderWorkoutMarker(workout){

        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth:300,
            minWidth:50,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`,
        }))
        .setPopupContent(`${workout.type === 'running' ? "🏃‍♂️":"🚴‍♀️"} ${workout.description}`)
        .openPopup();

    }

    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? "🏃‍♂️":"🚴‍♀️"}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;
        // adding second type dispite of class
        if(workout.type === "running")
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadance}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
          `
          if(workout.type === "cycling")
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>

            `
            form.insertAdjacentHTML('afterend',html)
    }
}


const app = new App();



