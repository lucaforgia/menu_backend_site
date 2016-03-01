(function(){
	var apiUrl = "http://localhost:3000/api/tiers";

	/*ReactDOM.render(
	  <h3>Hello, example!</h3>,
	  document.getElementById('example')
	);*/

	var findObj = function (arr,value,param) {
		var i,len;
		param = param || '_id';
		for(i = 0, len = arr.length; i < len; i++){
			if(arr[i][param] === value){
				return arr[i];
			}
		}
	};

	var NavEle = React.createClass({

		onClick:function (event) {
			this.props.onClick(event, this.props.id);
		},

		render:function () {
			return (
				<li onClick={this.onClick}>
					{this.props.title}
				</li>
			);
		}
	});

	var NavList = React.createClass({
		getInitialState:function () {
			return {cssClass:''};
		},
		componentDidMount:function () {
			var _t = this;
			// alert(this.props.type)
			if(this.props.type === 'next' || this.props.type === 'prev'){
				setTimeout(function () {
					_t.setState({cssClass:' move'});
				},0);
			}
		},
		render:function () {
			_t = this;
			var tier = this.props.tier;



			var children = (function () {
				if(tier){
					var childrenIds = tier.children;

					return childrenIds.map(function (id) {
						return findObj(_t.props.tiers,id);
					})
					.map(function (tier) {
						var onClick = function (event) {
							_t.props.onClick(event,tier._id);
						};
						return (<NavEle key={tier._id} onClick={onClick} id={tier._id} title={tier.title}/>);
					});
				}
			})();

			var title = (function(){
				if(tier){
					if(tier.parent === null){
						return 'Menu'
					}
					else{
						return tier.title || '';
					}
				}
			})();

			var classes = (function () {
				if(_t.props.type === 'next'){
					return 'nextTier' + _t.state.cssClass;
				}
				else if(_t.props.type === 'prev'){
					return 'prevTier' + _t.state.cssClass;
				}
				else{
					return 'currentTier';
				}
			})();

			return (
				<div className={classes}>
					<div className="cat-tier">
						{title}
					</div>
					<div>
						<ul>
							{children}
						</ul>
					</div>
				</div>
			);
		}
	});

	var Previous = React.createClass({
		render:function () {
			var _t = this;
			var inner = (function(){
				if(_t.props.currentTier){
					return ([
						<div key="aaa" onClick={_t.props.goToPreviousTier}>
							<img src="images/back.png"/>
						</div>,
						<div key="bbb" onClick={_t.props.returnToRoot}>
							<img src="images/home.png"/>
						</div>,
						<div key="ccc"></div>
					]);
				}
			})();

			return (
				<div className="header">
					{inner}
				</div>
			);
		}
	})

	var Menu = React.createClass({
		getInitialState:function(){
			return {tiers:[],currentTier:null,nextTiers:null,typeNext:null};
		},


		showNextTier:function (event,id) {
			this.setState({typeNext:'next'});
			this.showNewTier(event,id);
		},

		showPrevTier:function (event,id) {
			this.setState({typeNext:'prev'});
			this.showNewTier(event,id);
		},

		showNewTier:function (event,id) {
			var _t = this;
			var tiers = this.state.tiers;
			var currentTier = this.state.currentTier;
			var nextTier = findObj(tiers,id);

			if(nextTier.children && nextTier.children.length > 0){
				this.setState({nextTier:nextTier});
				setTimeout(function () {
					_t.setState({currentTier:nextTier, nextTier:null, typeNext:null});
				},400);
			}
			else if(nextTier.href && $.trim(nextTier.href) !== ''){
				alert("end point: go to " + nextTier.href);
			}
			else{
				alert('end point, but href not defined');
			}
		},

		componentDidMount:function () {
			var _t = this;
			$.getJSON(this.props.json,function (data) {
				var currentTier = findObj(data.tiers,null, 'parent');
				_t.setState({tiers:data.tiers, currentTier:currentTier, rootTier:currentTier._id});
			});
		},

		returnToRoot:function (event) {
			this.setState({typeNext:'prev'});
			// this.setState({currentTier:this.state.rootTier});
			this.showNewTier(event,this.state.rootTier);
		},

		goToPreviousTier:function (event) {
			// var parent = findObj(this.state.tiers,this.state.currentTier.parent);
			// this.setState({currentTier:parent});
			this.setState({typeNext:'prev'});
			this.showNewTier(event,this.state.currentTier.parent);
		},

		render:function(){
			var _t = this;

			var next = (function () {
				if(_t.state.nextTier){
					return (
						<NavList type={_t.state.typeNext} tiers={_t.state.tiers} tier={_t.state.nextTier} onClick={_t.showNextTier}/>
					);
				}
			})()
			return (
				<div id="nav-content-bg">
					<div>
						<Previous currentTier={this.state.currentTier} returnToRoot={this.returnToRoot} goToPreviousTier={this.goToPreviousTier}/>
						<div id="tierCarousel">
							<NavList type="currentTier" tiers={this.state.tiers} tier={this.state.currentTier} onClick={this.showNextTier}/>
							{next}
						</div>
					</div>
				</div>
			);
		}
	});

	ReactDOM.render(
		// <ul>
		// 	<NavEle name="caccona gigante"/>
		// </ul>,
		<Menu json={apiUrl} />,
		document.getElementById('nav-content')
	)



})();
