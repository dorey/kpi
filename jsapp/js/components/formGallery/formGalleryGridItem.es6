import React from 'react';
import bem from '../../bem';
import ReactDOM from 'react-dom';

let FormGalleryGridItem = React.createClass({
    componentDidMount() {
        var elem = ReactDOM.findDOMNode(this);
      	elem.style.opacity = 0;
      	window.requestAnimationFrame(function() {
      		elem.style.transition = "opacity 500ms";
      		elem.style.opacity = 1;
      	});
    },
    render(){
        let itemStyle = {
            backgroundImage: 'url(' + this.props.url + ')',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundSize: 'cover'
        }
        let perRow = (this.props.itemsPerRow) ? this.props.itemsPerRow : 6;
        let itemClass= "per-row"+perRow+" one-one";
        return (
            <bem.AssetGallery__gridItem className={itemClass} style={itemStyle} onClick={() => this.props.openModal(this.props.galleryIndex , this.props.galleryItemIndex)}>
                <bem.AssetGallery__gridItemOverlay>
                    <div className="text">
                        <h5>{this.props.itemTitle}</h5>
                        <p>{this.props.date}</p>
                    </div>
                </bem.AssetGallery__gridItemOverlay>
            </bem.AssetGallery__gridItem>
        );
    }
});


module.exports = FormGalleryGridItem;