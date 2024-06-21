function clampRange( x, min, max ) {
    return Math.min(Math.max(x, min), max);
};

function mapRange( x, fromMin, fromMax, toMin, toMax ) {
    return (x - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
};

function copyProps( src, dest ) {
    for( var prop in src ) {
        if( src.hasOwnProperty( prop ) ) {
            dest[prop] = src[prop];
        }
    }
};

function isDefined( x ) {
    return x !== undefined;
};

function isBlank( x ) {
    return x === '' || x === undefined;
};

function isEmpty( obj ) {
    for( var key in obj ) {
        if( obj.hasOwnProperty( key ) )
            return false;
    }
    return true;
};

var isArray = Array.isArray;

function joinText( arr ) {
    var text = '';
    arr.push( 'x' );
    for( var j = 0; j < arr.length - 1; j += 2 ) {
        if( !isBlank( arr[j] ) ) {
            text += arr[j] + ( isBlank(arr[j+2]) ? '' : arr[j+1] );
        }
    }
    return text;
};

function dateToString(time) {
    return time == undefined || isNaN(time) || time == -Infinity || time == Infinity ?
        '' :
        new Date(time).
        toLocaleString('en-uk', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
};

function removeElement( element ) {
    element.parentNode.removeChild( element );
};

function include( url, callback, error ) {
    var script = document.createElement( 'script' );
    script.src = url;
    script.type = 'text/javascript';
    if( callback ) script.onload = callback;
    if( error ) script.onerror = error;
    document.getElementsByTagName( 'head' )[0].appendChild( script );
};

if( Array.prototype.find === undefined ) {
    Array.prototype.find = function( match ) {
        for( var index = 0; index < this.length; ++index ) {
            if( match( this[index] ) ) return this[index];
        }
        return false;
    };
};

if( typeof Promise === 'undefined' ) {
    include( 'https://www.promisejs.org/polyfills/promise-7.0.4.min.js' );
};
